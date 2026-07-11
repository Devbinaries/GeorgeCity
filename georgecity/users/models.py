from django.db import models
from django.contrib.auth.models import AbstractUser

USER_CATEGORY_CHOICES = [
    ('INDIVIDUAL', 'Individual'),
    ('WHOLESELLER', 'Wholeseller'),
    ("RETAILER", "Retailer"),
]

FARMER_PERMISSIONS = [
    ("CAN_CREATE_PRODUCTS", "Can create products"),
    ("CAN_MANAGE_ORDERS", "Can manage orders"),
    ("CAN_VIEW_DELIVERY_STATUS", "Can view delivery status"),
    ("CAN_CREATE_POSTS", "Can create posts"),
]

USER_PERMISSIONS = [
    ("CAN_PLACE_ORDERS", "Can place orders"),
    ("CAN_VIEW_PRODUCTS", "Can view products"),
    ("CAN_VIEW_DELIVERY_STATUS", "Can view delivery status"),
]

DRIVER_PERMISSIONS = [
    ("CAN_DELIVER_ORDERS", "Can deliver orders"),
    ("CAN_VIEW_DELIVERY_STATUS", "Can view delivery status")
]

class BaseUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    address = models.CharField(max_length=255)
    phone_number = models.IntegerField(max_length=10, null=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name','phone_number']
    def __str__(self):
        return self.username
    
class Farmer(BaseUser):
    farm_name = models.CharField(max_length=100)
    farm_location = models.CharField(max_length=255)
    farm_size = models.DecimalField(max_digits=10, decimal_places=2)
    farm_type = models.CharField(max_length=100)

    class Meta:
        permissions = FARMER_PERMISSIONS  # Assign the farmer permissions to this model

    def __str__(self):
        return self.username

class Consumer(BaseUser):
    """Consumer model to handle consumers of the marketplace"""
    category = models.CharField(max_length=50, choices=USER_CATEGORY_CHOICES, default='INDIVIDUAL')

    class Meta:
        permissions = USER_PERMISSIONS  # Assign the consumer permissions to this model

    def __str__(self):
        return self.username
    
class Driver(BaseUser):
    """Driver model to handle delivery between farmers and consumers"""
    
    class Meta:
        permissions = DRIVER_PERMISSIONS  # Assign the driver permissions to this model
