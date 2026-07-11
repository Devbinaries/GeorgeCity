from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LinkPaymentMethodView,
    InitiatePaymentView,
    TransactionStatusView,
    PaystackWebhookView,
    PayoneerWebhookView,
    TransactionsView,
    WalletViewSet,
)

router = DefaultRouter()
router.register(r'wallet', WalletViewSet, basename='wallet')

urlpatterns = [
    path('', include(router.urls)),
    path('link-method/', LinkPaymentMethodView.as_view(), name='link_payment_method'),
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('status/<str:transaction_id>/', TransactionStatusView.as_view(), name='transaction_status'),
    path('paystack/webhook/', PaystackWebhookView.as_view(), name='paystack_webhook'),
    path('payoneer/webhook/', PayoneerWebhookView.as_view(), name='payoneer_webhook'),
    path('transactions/', TransactionsView.as_view(), name='transactions'),
]
