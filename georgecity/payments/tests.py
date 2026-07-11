import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from payments.models import Wallet, Transactions
from payments.services.momo_service import MomoService
from payments.services.payoneer_service import PayoneerService

User = get_user_model()

class PaymentServicesTestCase(TestCase):
    def setUp(self):
        self.momo_service = MomoService()
        self.payoneer_service = PayoneerService()

    def test_momo_service_mock_methods(self):
        """
        Test that MomoService methods execute correctly in mock mode.
        """
        self.assertTrue(self.momo_service.is_mock)
        
        # Test API user creation
        api_user = self.momo_service.create_api_user()
        self.assertIsNotNone(api_user)
        self.assertEqual(len(api_user), 36) # UUID length

        # Test API key generation
        api_key = self.momo_service.generate_api_key(api_user)
        self.assertEqual(api_key, "mock_api_key_1234567890abcdef")

        # Test token generation
        token = self.momo_service.get_token()
        self.assertEqual(token, "mock_jwt_access_token_abc123")

        # Test request to pay
        pay_res = self.momo_service.request_to_pay(
            amount=100.0,
            currency="EUR",
            phone_number="256770000000",
            external_id="ext-123"
        )
        self.assertEqual(pay_res['status'], 'PENDING')
        self.assertTrue(pay_res['is_mock'])
        self.assertIsNotNone(pay_res['reference_id'])

        # Test status check
        status_res = self.momo_service.get_transaction_status(pay_res['reference_id'])
        self.assertEqual(status_res['status'], 'SUCCESSFUL')
        self.assertEqual(status_res['amount'], '10.00')

    def test_payoneer_service_mock_methods(self):
        """
        Test that PayoneerService methods execute correctly in mock mode.
        """
        self.assertTrue(self.payoneer_service.is_mock)

        # Test token generation
        token = self.payoneer_service.get_token()
        self.assertEqual(token, "mock_payoneer_oauth_token_xyz789")

        # Test payment request creation
        pay_res = self.payoneer_service.create_payment_request(
            amount=50.0,
            currency="USD",
            description="Test checkout",
            client_reference_id="ref-456",
            return_url="http://localhost:5000/return",
            callback_url="http://localhost:5000/callback"
        )
        self.assertEqual(pay_res['status'], 'PENDING')
        self.assertTrue(pay_res['is_mock'])
        self.assertIsNotNone(pay_res['payment_id'])
        self.assertIn(pay_res['payment_id'], pay_res['redirect_url'])

        # Test status check
        status_res = self.payoneer_service.get_payment_status(pay_res['payment_id'])
        self.assertEqual(status_res['status'], 'APPROVED')

        # Test payouts
        payout_res = self.payoneer_service.send_payout(
            amount=150.00,
            currency="USD",
            payee_id="payee-abc",
            client_reference_id="payout-ref-1"
        )
        self.assertEqual(payout_res['status'], 'SUBMITTED')
        self.assertTrue(payout_res['is_mock'])
        self.assertIsNotNone(payout_res['payout_id'])


class PaymentsAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.sender_user = User.objects.create_user(
            username="sender", 
            email="sender@example.com", 
            password="testpassword123"
        )
        self.receiver_user = User.objects.create_user(
            username="receiver", 
            email="receiver@example.com", 
            password="testpassword123"
        )

        # Create wallet for sender
        self.sender_wallet = Wallet.objects.create(
            user=self.sender_user,
            balance=0.00,
            wallet_type='MTN Mobile Money',
            momo_phone_number='256770000000'
        )
        self.receiver_wallet = Wallet.objects.create(
            user=self.receiver_user,
            balance=0.00,
            wallet_type='Payoneer',
            payoneer_email='receiver@payoneer.com',
            payoneer_payee_id='payee_rec_123'
        )

    def test_link_payment_method(self):
        self.client.force_authenticate(user=self.sender_user)
        url = reverse('link_payment_method')
        
        # Link MoMo details
        data = {
            'wallet_type': 'MTN Mobile Money',
            'momo_phone_number': '256771112223'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.sender_wallet.refresh_from_db()
        self.assertEqual(self.sender_wallet.momo_phone_number, '256771112223')
        self.assertEqual(self.sender_wallet.wallet_type, 'MTN Mobile Money')

    def test_initiate_momo_payment(self):
        self.client.force_authenticate(user=self.sender_user)
        url = reverse('initiate_payment')
        
        data = {
            'amount': 250.00,
            'payment_method': 'MTN Mobile Money',
            'phone_number': '256770000000',
            'receiver_id': self.receiver_user.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('transaction', response.data)
        self.assertIn('momo_reference', response.data)
        
        tx_id = response.data['transaction']['transaction_id']
        tx = Transactions.objects.get(transaction_id=tx_id)
        self.assertEqual(tx.amount, 250.00)
        self.assertEqual(tx.payment_method, 'MTN Mobile Money')
        self.assertEqual(tx.sender, self.sender_user)
        self.assertEqual(tx.receiver, self.receiver_user)
        self.assertEqual(tx.status, 'PENDING')

    def test_initiate_payoneer_payment(self):
        self.client.force_authenticate(user=self.sender_user)
        url = reverse('initiate_payment')
        
        data = {
            'amount': 85.50,
            'payment_method': 'Payoneer',
            'receiver_id': self.receiver_user.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('redirect_url', response.data)
        self.assertIn('payoneer_payment_id', response.data)
        
        tx_id = response.data['transaction']['transaction_id']
        tx = Transactions.objects.get(transaction_id=tx_id)
        self.assertEqual(tx.amount, 85.50)
        self.assertEqual(tx.payment_method, 'Payoneer')
        self.assertEqual(tx.status, 'PENDING')

    def test_check_transaction_status(self):
        # Create a pending transaction
        tx = Transactions.objects.create(
            transaction_id="tx-status-test",
            amount=40.00,
            status='PENDING',
            payment_method='MTN Mobile Money',
            external_reference=str(uuid.uuid4()),
            sender=self.sender_user,
            receiver=self.receiver_user
        )
        
        self.client.force_authenticate(user=self.sender_user)
        url = reverse('transaction_status', kwargs={'transaction_id': tx.transaction_id})
        
        # Check status (should trigger mock successful response updating wallet balances)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'SUCCESSFUL')
        
        # Verify DB updated
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESSFUL')
        
        # Verify receiver wallet got credited
        self.receiver_wallet.refresh_from_db()
        self.assertEqual(self.receiver_wallet.balance, 40.00)

    def test_momo_webhook_callback(self):
        # Create pending transaction
        ref_id = str(uuid.uuid4())
        tx = Transactions.objects.create(
            transaction_id="tx-webhook-momo",
            amount=99.00,
            status='PENDING',
            payment_method='MTN Mobile Money',
            external_reference=ref_id,
            sender=self.sender_user
        )
        
        url = reverse('momo_webhook')
        data = {
            'referenceId': ref_id,
            'status': 'SUCCESSFUL'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check transaction and wallet balances
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESSFUL')
        
        # Sender wallet should be credited (since receiver is None - wallet funding)
        self.sender_wallet.refresh_from_db()
        self.assertEqual(self.sender_wallet.balance, 99.00)
