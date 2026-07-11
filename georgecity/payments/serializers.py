from rest_framework import serializers
from .models import Transactions, Wallet

class TransactionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transactions
        fields = ['id', 'transaction_id', 'amount', 'status', 'payment_method', 'external_reference', 'created_at', 'updated_at', 'sender', 'receiver']

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'user', 'balance', 'created_at', 'updated_at', 'wallet_type', 'paystack_email', 'payoneer_email', 'payoneer_payee_id']