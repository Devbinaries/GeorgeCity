import uuid
import json
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Transactions, Wallet
from .serializers import TransactionsSerializer, WalletSerializer
from .services.paystack_service import PaystackService
from .services.payoneer_service import PayoneerService


def _credit_wallets(transaction):
    """
    Helper method to adjust wallet balances upon successful transaction.
    """
    amount = transaction.amount
    if transaction.receiver:
        # Transfer between users: credit receiver
        receiver_wallet, _ = Wallet.objects.get_or_create(user=transaction.receiver)
        receiver_wallet.balance += amount
        receiver_wallet.save()
    else:
        # Wallet funding: credit sender's own wallet
        sender_wallet, _ = Wallet.objects.get_or_create(user=transaction.sender)
        sender_wallet.balance += amount
        sender_wallet.save()


class LinkPaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Link a Paystack mobile money phone/provider or Payoneer email/payee ID
        to the user's wallet.
        """
        user = request.user
        wallet, created = Wallet.objects.get_or_create(user=user)

        wallet_type = request.data.get('wallet_type')
        if wallet_type:
            if wallet_type not in ['Paystack', 'Payoneer']:
                return Response(
                    {"error": "Invalid wallet type. Must be 'Paystack' or 'Payoneer'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            wallet.wallet_type = wallet_type

        # Paystack fields
        if 'paystack_email' in request.data:
            wallet.paystack_email = request.data.get('paystack_email')

        # Payoneer fields
        if 'payoneer_email' in request.data:
            wallet.payoneer_email = request.data.get('payoneer_email')
        if 'payoneer_payee_id' in request.data:
            wallet.payoneer_payee_id = request.data.get('payoneer_payee_id')

        wallet.save()
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Initiate a payment transaction.

        payment_method options:
            'Paystack'  – mobile money charge (MTN / Vodafone / AirtelTigo)
            'Payoneer'  – hosted checkout redirect

        For Paystack mobile money:
            Required: phone, provider (mtn|vod|atl)
            Optional: paystack_email (falls back to user email, then wallet email)
        """
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method')  # 'Paystack' or 'Payoneer'
        receiver_id = request.data.get('receiver_id')

        if not amount or not payment_method:
            return Response(
                {"error": "amount and payment_method are required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {"error": "amount must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        wallet, _ = Wallet.objects.get_or_create(user=request.user)

        receiver = None
        if receiver_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            receiver = get_object_or_404(User, id=receiver_id)

        local_tx_id = f"tx_{uuid.uuid4().hex[:16]}"

        # ─────────────────── Paystack mobile money ───────────────────
        if payment_method == 'Paystack':
            phone = request.data.get('phone')
            provider = request.data.get('provider', 'mtn')

            # Resolve email: request → wallet email → user email
            email = (
                request.data.get('paystack_email')
                or wallet.paystack_email
                or getattr(request.user, 'email', None)
            )

            if not phone:
                return Response(
                    {"error": "phone is required for Paystack mobile money payments."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not email:
                return Response(
                    {"error": "email is required for Paystack payments. Link one to your wallet."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            paystack = PaystackService()
            try:
                res = paystack.charge_mobile_money(
                    email=email,
                    amount_ghs=amount,
                    phone=phone,
                    provider=provider,
                    reference=local_tx_id,
                )

                transaction = Transactions.objects.create(
                    transaction_id=local_tx_id,
                    amount=amount,
                    status='PENDING',
                    payment_method='Paystack',
                    external_reference=local_tx_id,  # reference == tx id for Paystack
                    sender=request.user,
                    receiver=receiver,
                )

                return Response(
                    {
                        "message": "Paystack mobile money charge initiated. Customer will receive a payment prompt.",
                        "transaction": TransactionsSerializer(transaction).data,
                        "paystack_status": res.get("paystack_status", "pending"),
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                return Response(
                    {"error": f"Paystack error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # ─────────────────── Payoneer checkout ───────────────────────
        elif payment_method == 'Payoneer':
            payoneer_service = PayoneerService()
            return_url = request.data.get('return_url', 'http://localhost:5173/wallet')
            callback_url = request.data.get('callback_url', 'http://localhost:8000/api/payments/payoneer/webhook/')
            payee_id = request.data.get('payee_id') or wallet.payoneer_payee_id

            try:
                res = payoneer_service.create_payment_request(
                    amount=amount,
                    currency="USD",
                    description=f"Order payment by {request.user.username}",
                    client_reference_id=local_tx_id,
                    return_url=return_url,
                    callback_url=callback_url,
                    payee_id=payee_id,
                )

                transaction = Transactions.objects.create(
                    transaction_id=local_tx_id,
                    amount=amount,
                    status='PENDING',
                    payment_method='Payoneer',
                    external_reference=res['payment_id'],
                    sender=request.user,
                    receiver=receiver,
                )

                return Response(
                    {
                        "message": "Payoneer payment request created.",
                        "transaction": TransactionsSerializer(transaction).data,
                        "redirect_url": res['redirect_url'],
                        "payoneer_payment_id": res['payment_id'],
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                return Response(
                    {"error": f"Payoneer integration error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        else:
            return Response(
                {"error": "Unsupported payment method. Must be 'Paystack' or 'Payoneer'."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TransactionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        """
        Check the status of a local transaction; verify with the provider API,
        update DB, and return the current status.
        """
        transaction = get_object_or_404(Transactions, transaction_id=transaction_id)

        if request.user != transaction.sender and request.user != transaction.receiver and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to view this transaction."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Already final — just return
        if transaction.status in ['SUCCESSFUL', 'FAILED']:
            return Response(TransactionsSerializer(transaction).data, status=status.HTTP_200_OK)

        # Poll provider for live status
        if transaction.payment_method == 'Paystack':
            paystack = PaystackService()
            try:
                res = paystack.verify_transaction(transaction.external_reference)
                mapped_status = res.get('status')

                if mapped_status == 'SUCCESSFUL':
                    transaction.status = 'SUCCESSFUL'
                    _credit_wallets(transaction)
                elif mapped_status == 'FAILED':
                    transaction.status = 'FAILED'

                transaction.save()
            except Exception:
                pass  # Return whatever status we have

        elif transaction.payment_method == 'Payoneer':
            payoneer_service = PayoneerService()
            try:
                res = payoneer_service.get_payment_status(transaction.external_reference)
                payoneer_status = res.get('status')

                if payoneer_status in ['APPROVED', 'COMPLETED']:
                    transaction.status = 'SUCCESSFUL'
                    _credit_wallets(transaction)
                elif payoneer_status in ['CANCELLED', 'DECLINED']:
                    transaction.status = 'FAILED'

                transaction.save()
            except Exception:
                pass

        return Response(TransactionsSerializer(transaction).data, status=status.HTTP_200_OK)


class PaystackWebhookView(APIView):
    """
    Receives Paystack webhook events (e.g. charge.success).
    Validates the x-paystack-signature header before processing.
    """

    def post(self, request):
        raw_body = request.body
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')

        paystack = PaystackService()

        # Validate signature (skip in mock mode)
        if not paystack.is_mock:
            if not paystack.verify_webhook_signature(raw_body, signature):
                return Response({"error": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)

        event = data.get('event')
        tx_data = data.get('data', {})
        reference = tx_data.get('reference')

        if not reference:
            return Response({"error": "Missing reference"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transactions.objects.get(external_reference=reference)
            if transaction.status == 'PENDING':
                if event == 'charge.success':
                    transaction.status = 'SUCCESSFUL'
                    _credit_wallets(transaction)
                elif event in ('charge.failed', 'transfer.failed'):
                    transaction.status = 'FAILED'
                transaction.save()
            return Response({"status": "processed"}, status=status.HTTP_200_OK)
        except Transactions.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)


class PayoneerWebhookView(APIView):
    """
    Payoneer Callback / Webhook endpoint.
    """

    def post(self, request):
        data = request.data
        payment_id = data.get('payment_id')
        status_value = data.get('status')

        if not payment_id:
            return Response({"error": "Missing payment_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transactions.objects.get(external_reference=payment_id)
            if transaction.status == 'PENDING':
                if status_value in ['APPROVED', 'COMPLETED']:
                    transaction.status = 'SUCCESSFUL'
                    _credit_wallets(transaction)
                elif status_value in ['CANCELLED', 'DECLINED']:
                    transaction.status = 'FAILED'
                transaction.save()
            return Response({"status": "processed"}, status=status.HTTP_200_OK)
        except Transactions.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)


class TransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = (
            Transactions.objects.filter(sender=request.user)
            | Transactions.objects.filter(receiver=request.user)
        )
        serializer = TransactionsSerializer(transactions, many=True)
        return Response(serializer.data, status=200)

    def post(self, request):
        serializer = TransactionsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class WalletViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Wallet.objects.all()
    serializer_class = WalletSerializer

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)