from django.shortcuts import render
from django.contrib.auth.mixins import PermissionRequiredMixin 
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter
from django.db.models import Q
from .serializers import (
    FarmSerializer, FarmProductSerializer, OrderSerializer, OrderItemSerializer,
    PostsSerializer, PostsEngagementSerializer, ChatSerializer, HireRequestSerializer)
from .models import Farm, FarmProduct, OrderItem, Order, Posts, PostEngagement, Chat, HireRequest
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action

# Create your views here.
class FarmViewSet(ModelViewSet):
    model = Farm
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        owner_param = self.request.query_params.get('owner')
        if owner_param == 'me':
            queryset = queryset.filter(owner__id=self.request.user.id)
        return queryset

class FarmProductViewSet(ModelViewSet):
    model = FarmProduct
    queryset = FarmProduct.objects.all()
    serializer_class = FarmProductSerializer
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        farm_param = self.request.query_params.get('farm')
        owner_param = self.request.query_params.get('owner')
        if farm_param:
            queryset = queryset.filter(farm__id=farm_param)
        if owner_param == 'me':
            queryset = queryset.filter(farm__owner__id=self.request.user.id)
        return queryset

class OrderViewSet(ModelViewSet):
    model = Order
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        driver_param = self.request.query_params.get('driver')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if driver_param:
            if driver_param == 'me':
                queryset = queryset.filter(driver=self.request.user)
            elif driver_param == 'null':
                queryset = queryset.filter(driver__isnull=True)
            else:
                queryset = queryset.filter(driver__username=driver_param)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept_order(self, request, pk=None):
        from users.models import Driver
        try:
            driver = Driver.objects.get(id=request.user.id)
        except Driver.DoesNotExist:
            return Response({"error": "Only drivers can accept orders."}, status=status.HTTP_400_BAD_REQUEST)
        
        order = self.get_object()
        if order.driver is not None:
            return Response({"error": "Order is already accepted by another driver."}, status=status.HTTP_400_BAD_REQUEST)
            
        order.driver = driver
        order.status = 'ASSIGNED'
        if order.produced_by and order.produced_by.latitude:
            order.driver_latitude = order.produced_by.latitude
            order.driver_longitude = order.produced_by.longitude
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pickup_order(self, request, pk=None):
        order = self.get_object()
        if not order.driver or order.driver.id != request.user.id:
            return Response({"error": "You are not the driver assigned to this order."}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'ASSIGNED':
            return Response({"error": "Order must be in ASSIGNED status to be picked up."}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = 'PICKED_UP'
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def deliver_order(self, request, pk=None):
        order = self.get_object()
        if not order.driver or order.driver.id != request.user.id:
            return Response({"error": "You are not the driver assigned to this order."}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'PICKED_UP':
            return Response({"error": "Order must be in PICKED_UP status to be delivered."}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = 'DELIVERED'
        order.save()
        return Response(OrderSerializer(order, context={'request': request}).data)

class OrderItemViewSet(ModelViewSet):
    model = OrderItem
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    # permission_classes = [IsAuthenticated]

class FarmProductSearch(ListAPIView):
    serializer_class = FarmProductSerializer
    queryset = FarmProduct.objects.all()
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        query = self.request.GET.get('query', None)
        if query:
            products = FarmProduct.objects.filter(name__icontains=query)
            serializer = FarmProductSerializer(products, many=True)
            return Response(serializer.data)
        else:
            return Response({"error": "No search query provided."}, status=400)
        
    def post(self, request):
        data = request.data
        serializer = FarmProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)
        
class OrderItemSearch(ListAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    filter_backends = [SearchFilter]
    search_fields = ["product__name"]
    # permission_classes = [IsAuthenticated]

class OrderSearch(ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    filter_backends = [SearchFilter]
    # permission_classes = [IsAuthenticated]
    search_fields = ["product__name", "ordered_by__username", "produced_by__name"]

class PostsViewSet(ModelViewSet,PermissionRequiredMixin):
    model = Posts
    serializer_class = PostsSerializer
    permission_required = ['marketplace.view_posts',"farmer.create_posts"]
    queryset = Posts.objects.all().order_by('-created_at')
    # permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['post', 'author__username']

class PostEngagementViewSet(ModelViewSet):
    model = PostEngagement
    serializer_class = PostsEngagementSerializer
    queryset = PostEngagement.objects.all()
    # permission_classes = [IsAuthenticated]


class ChatViewSet(ModelViewSet):
    model = Chat
    serializer_class = ChatSerializer
    queryset = Chat.objects.select_related('sender', 'receiver').all()
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset().order_by('id')
        peer_username = self.request.query_params.get('peer')
        if peer_username:
            queryset = queryset.filter(
                Q(sender__username=peer_username) | Q(receiver__username=peer_username)
            )
        return queryset


class HireRequestViewSet(ModelViewSet):
    """Farmers create hire requests; drivers accept or reject them."""
    serializer_class = HireRequestSerializer
    queryset = HireRequest.objects.select_related('farmer', 'driver').all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role == 'farmer':
            # Requests the currently logged-in farmer sent
            queryset = queryset.filter(farmer__id=self.request.user.id)
        elif role == 'driver':
            # Requests received by the currently logged-in driver
            queryset = queryset.filter(driver__id=self.request.user.id)
        return queryset

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        from users.models import Driver
        hire_request = self.get_object()
        try:
            Driver.objects.get(id=request.user.id)
        except Driver.DoesNotExist:
            return Response({"error": "Only drivers can accept hire requests."}, status=status.HTTP_403_FORBIDDEN)
        if hire_request.driver.id != request.user.id:
            return Response({"error": "This request is not addressed to you."}, status=status.HTTP_403_FORBIDDEN)
        if hire_request.status != 'PENDING':
            return Response({"error": f"Request is already {hire_request.status}."}, status=status.HTTP_400_BAD_REQUEST)
        hire_request.status = 'ACCEPTED'
        hire_request.save()
        return Response(HireRequestSerializer(hire_request).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        from users.models import Driver
        hire_request = self.get_object()
        try:
            Driver.objects.get(id=request.user.id)
        except Driver.DoesNotExist:
            return Response({"error": "Only drivers can reject hire requests."}, status=status.HTTP_403_FORBIDDEN)
        if hire_request.driver.id != request.user.id:
            return Response({"error": "This request is not addressed to you."}, status=status.HTTP_403_FORBIDDEN)
        if hire_request.status != 'PENDING':
            return Response({"error": f"Request is already {hire_request.status}."}, status=status.HTTP_400_BAD_REQUEST)
        hire_request.status = 'REJECTED'
        hire_request.save()
        return Response(HireRequestSerializer(hire_request).data)
