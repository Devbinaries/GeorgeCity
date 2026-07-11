from django.db import models
from users.models import Farmer
import random

def get_random_coordinates_near_george():
    # George, South Africa coordinates: Lat ~ -33.9608, Lng ~ 22.4616
    lat = -33.9608 + random.uniform(-0.03, 0.03)
    lng = 22.4616 + random.uniform(-0.03, 0.03)
    return round(lat, 6), round(lng, 6)

# Create your models here.
CATEGORY_CHOICES = [
    ("fruits", "Fruits"),
    ("vegetables", "Vegetables"),
    ("crops", "Crops"),
    ("livestock", "Livestock"),
    ("dairy", "Dairy"),
    ("poultry", "Poultry"),
]

ORDER_TYPES = [
    ("WHOLESALE", "Wholesale"),
    ("RETAIL", "Retail"),
]
class Farm(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    size = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=100)
    owner = models.ForeignKey("users.Farmer", on_delete=models.CASCADE, related_name="farms")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.latitude or not self.longitude:
            self.latitude, self.longitude = get_random_coordinates_near_george()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class FarmProduct(models.Model):
    product = models.CharField(max_length=100, blank=False)
    quntity = models.IntegerField(blank=False)
    in_stock = models.BooleanField(default=True)
    farmer = models.ForeignKey("users.Farmer", on_delete=models.CASCADE, related_name="products")
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='products/', blank=True, null=True)

    def __str__(self):
        return self.product
    
class Order(models.Model):
    product = models.ForeignKey("FarmProduct", on_delete=models.CASCADE, related_name="orders")
    quantity = models.IntegerField()
    ordered_by = models.ForeignKey("users.Consumer", on_delete=models.CASCADE, related_name="orders")
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES,default="RETAIL")
    produced_by = models.ForeignKey("Farm", on_delete=models.CASCADE, related_name="orders")
    deliver_to = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    driver = models.ForeignKey("users.Driver", on_delete=models.SET_NULL, null=True, blank=True, related_name="deliveries")
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('PICKED_UP', 'Picked Up'),
        ('DELIVERED', 'Delivered')
    ], default='PENDING')
    driver_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    driver_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.latitude or not self.longitude:
            self.latitude, self.longitude = get_random_coordinates_near_george()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order of {self.product.product} by {self.ordered_by.username}"
   
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(FarmProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product.product}"

class Chat(models.Model):
    sender = models.ForeignKey("users.BaseUser", on_delete=models.CASCADE, related_name="sent_chats")
    receiver = models.ForeignKey("users.BaseUser", on_delete=models.CASCADE, related_name="received_chats")
    message = models.TextField()
    reply = models.TextField(blank=True, null=True)

class Posts(models.Model):
    post = models.TextField()
    media = models.FileField(upload_to='posts/', blank=True, null=True)
    author = models.ForeignKey("users.Farmer", on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class PostEngagement(models.Model):
    post = models.ForeignKey(Posts, on_delete=models.CASCADE, related_name="engagement") 
    likes = models.IntegerField(default=0)
    comments = models.TextField(blank=True)

HIRE_STATUS_CHOICES = [
    ('PENDING', 'Pending'),
    ('ACCEPTED', 'Accepted'),
    ('REJECTED', 'Rejected'),
]

class HireRequest(models.Model):
    """Represents a hire request sent by a farmer to a driver."""
    farmer = models.ForeignKey("users.Farmer", on_delete=models.CASCADE, related_name="hire_requests_sent")
    driver = models.ForeignKey("users.Driver", on_delete=models.CASCADE, related_name="hire_requests_received")
    message = models.TextField(blank=True, null=True, help_text="Optional note from the farmer")
    status = models.CharField(max_length=20, choices=HIRE_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('farmer', 'driver')  # one request per farmer-driver pair
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.farmer.username} → {self.driver.username} [{self.status}]"
   