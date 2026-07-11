from django.contrib import admin

from .models import Farm,FarmProduct, OrderItem, Order,Posts
# Register your models here.
admin.site.register(FarmProduct)
admin.site.register(Farm)
admin.site.register(Order)
admin.site.register(Posts)
admin.site.register(OrderItem)