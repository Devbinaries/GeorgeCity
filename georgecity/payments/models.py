from django.db import models

WALLET_TYPE = [
    ('Paystack', 'Paystack'),
    ('Payoneer', 'Payoneer'),
]

class Transactions(models.Model):
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING')  # PENDING, SUCCESSFUL, FAILED
    payment_method = models.CharField(max_length=20, choices=WALLET_TYPE, blank=True, null=True)
    external_reference = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sender = models.ForeignKey("users.BaseUser", on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions_sent")
    receiver = models.ForeignKey("users.BaseUser", on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions_received")

    def __str__(self):
        return f"{self.transaction_id} ({self.status})"
    
class Wallet(models.Model):
    user = models.OneToOneField("users.BaseUser", on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    wallet_type = models.CharField(max_length=20, choices=WALLET_TYPE, default='Paystack')
    
    # Linked payment details
    paystack_email = models.EmailField(blank=True, null=True)
    payoneer_email = models.EmailField(blank=True, null=True)
    payoneer_payee_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Wallet"
    