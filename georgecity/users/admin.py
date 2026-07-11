from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.admin import ModelAdmin

from .models import BaseUser, Farmer, Consumer, Driver
# Register your models here.
@admin.register(BaseUser)
class UserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

admin.site.register(Farmer)
admin.site.register(Consumer)
admin.site.register(Driver)