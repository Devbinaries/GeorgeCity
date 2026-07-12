from django.contrib.auth import get_user_model
from rest_framework.serializers import HyperlinkedModelSerializer
from rest_framework import serializers
from .models import Farm, FarmProduct, Order, OrderItem, Posts, PostEngagement, Chat, HireRequest

User = get_user_model()

class FarmSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Farm
        fields = ['id', 'name', 'location', 'size', 'type', 'owner', 'created_at']

class FarmProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmProduct
        fields = ['id', 'product', 'quntity', 'in_stock', 'farmer', 'created_at', 'category', 'description', 'photo']

class OrderSerializer(serializers.ModelSerializer):
    driver_username = serializers.CharField(source='driver.username', read_only=True, default=None)
    ordered_by_username = serializers.CharField(source='ordered_by.username', read_only=True)
    produced_by_name = serializers.CharField(source='produced_by.name', read_only=True)
    produced_by_latitude = serializers.DecimalField(source='produced_by.latitude', read_only=True, max_digits=9, decimal_places=6, default=None)
    produced_by_longitude = serializers.DecimalField(source='produced_by.longitude', read_only=True, max_digits=9, decimal_places=6, default=None)
    product_name = serializers.CharField(source='product.product', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'product', 'product_name', 'quantity', 
            'ordered_by', 'ordered_by_username', 'produced_by', 'produced_by_name', 
            'produced_by_latitude', 'produced_by_longitude',
            'deliver_to', 'status', 'driver', 'driver_username', 
            'driver_latitude', 'driver_longitude', 'latitude', 'longitude'
        ]
        extra_kwargs = {
            'driver': {'required': False, 'allow_null': True},
            'latitude': {'required': False, 'allow_null': True},
            'longitude': {'required': False, 'allow_null': True},
            'driver_latitude': {'required': False, 'allow_null': True},
            'driver_longitude': {'required': False, 'allow_null': True},
        }

class OrderItemSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'quantity']

class PostsSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Posts
        fields = ['id', 'post', 'media', 'author', 'author_username', 'created_at']
        extra_kwargs = {
            'author': {'read_only': True},
            'media': {'required': False, 'allow_null': True},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("You must be logged in to create a post.")

        try:
            author = request.user.farmer
        except AttributeError as error:
            raise serializers.ValidationError("Only farmers can create posts.") from error

        validated_data['author'] = author
        return Posts.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Only allow editing the post text and media; author is immutable
        instance.post = validated_data.get('post', instance.post)
        if 'media' in validated_data:
            instance.media = validated_data['media']
        instance.save()
        return instance
    
class PostsEngagementSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = PostEngagement
        fields = ['id', 'post', 'likes', 'comments']       


class ChatSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username', read_only=True)
    receiver = serializers.CharField(source='receiver.username', read_only=True)
    sender_username = serializers.CharField(write_only=True)
    receiver_username = serializers.CharField(write_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'sender', 'receiver', 'sender_username', 'receiver_username', 'message', 'reply']
        extra_kwargs = {
            'reply': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def create(self, validated_data):
        sender_username = validated_data.pop('sender_username')
        receiver_username = validated_data.pop('receiver_username')

        try:
            sender = User.objects.get(username=sender_username)
            receiver = User.objects.get(username=receiver_username)
        except User.DoesNotExist as error:
            raise serializers.ValidationError('Sender or receiver user was not found.') from error

        return Chat.objects.create(sender=sender, receiver=receiver, **validated_data)


class HireRequestSerializer(serializers.ModelSerializer):
    farmer_username = serializers.CharField(source='farmer.username', read_only=True)
    farmer_name = serializers.SerializerMethodField()
    farmer_farm_name = serializers.CharField(source='farmer.farm_name', read_only=True)
    farmer_phone = serializers.CharField(source='farmer.phone_number', read_only=True)
    driver_username = serializers.CharField(source='driver.username', read_only=True)
    driver_name = serializers.SerializerMethodField()
    driver_phone = serializers.CharField(source='driver.phone_number', read_only=True)

    class Meta:
        model = HireRequest
        fields = [
            'id', 'farmer', 'farmer_username', 'farmer_name', 'farmer_farm_name', 'farmer_phone',
            'driver', 'driver_username', 'driver_name', 'driver_phone',
            'message', 'status', 'created_at'
        ]
        extra_kwargs = {
            'farmer': {'required': True},
            'driver': {'required': True},
            'message': {'required': False, 'allow_blank': True, 'allow_null': True},
            'status': {'read_only': True},
        }

    def get_farmer_name(self, obj):
        return f"{obj.farmer.first_name} {obj.farmer.last_name}".strip() or obj.farmer.username

    def get_driver_name(self, obj):
        return f"{obj.driver.first_name} {obj.driver.last_name}".strip() or obj.driver.username