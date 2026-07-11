from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework_simplejwt import authentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status


from .models import Farmer,Consumer,Driver
from .serializers import FarmerSerializer,ConsumerSerializer,DriverSerializer,LoginSerializer
# Create your views here.
# User Autherntication

class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [authentication.JWTAuthentication]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')
        user = authenticate(username=username, password=password)
            
        if user is not None:
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            
            # Determine user type
            user_type = 'user'
            if isinstance(user, Farmer):
                user_type = 'farmer'
            elif isinstance(user, Consumer):
                user_type = 'consumer'
            elif isinstance(user, Driver):
                user_type = 'driver'
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'photo': user.photo.url if user.photo else None,
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
class FarmerRegistrationView(APIView):
    def post(self, request):
        serializer = FarmerSerializer(data=self.request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FarmerViewSet(ModelViewSet):
    model = Farmer
    serializer_class = FarmerSerializer
    queryset = Farmer.objects.all()
    lookup_field = 'username'
    # permission_classes = [IsAuthenticated]
    authentication_classes = [authentication.JWTAuthentication]

class ConsumerRegistrationView(APIView):
    def post(self, request):
        serializer = ConsumerSerializer(data=self.request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ConsumerViewSet(ModelViewSet):
    model = Consumer
    serializer_class = ConsumerSerializer
    queryset = Consumer.objects.all()
    lookup_field = 'username'
    # permission_classes = [IsAuthenticated]

class DriverRegistrationView(APIView):
    def post(self, request):
        serializer = DriverSerializer(data=self.request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [authentication.JWTAuthentication]

    def get(self, request):
        user = request.user

        if isinstance(user, Farmer):
            serializer = FarmerSerializer(user)
        elif isinstance(user, Consumer):
            serializer = ConsumerSerializer(user)
        elif isinstance(user, Driver):
            serializer = DriverSerializer(user)
        else:
            serializer = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'photo': user.photo.url if user.photo else None,
            }
            return Response(serializer, status=status.HTTP_200_OK)

        return Response(serializer.data, status=status.HTTP_200_OK)

class DriverViewSet(ModelViewSet):
    model = Driver 
    serializer_class = DriverSerializer
    queryset = Driver.objects.all()
    lookup_field = 'username'
    # permission_classes = [IsAuthenticated]

class ConsumerSearchView(ListAPIView):
    model = Consumer
    serializer_class = ConsumerSerializer
    queryset = Consumer.objects.all()
    lookup_field = 'username'
    search_fields = ['username', 'first_name', 'last_name']
    filter_backends = [SearchFilter]
    permission_classes = [IsAuthenticated]

class FarmerSearchView(ListAPIView):
    model = Farmer
    serializer_class = FarmerSerializer
    queryset = Farmer.objects.all()
    lookup_field = 'username'
    search_fields = ['username', 'first_name', 'last_name']
    filter_backends = [SearchFilter]
    permission_classes = [IsAuthenticated]

class DriverSearchView(ListAPIView):
    model = Driver
    serializer_class = DriverSerializer
    queryset = Driver.objects.all()
    lookup_field = 'username'
    search_fields = ['username', 'first_name', 'last_name']
    filter_backends = [SearchFilter]
    permission_classes = [IsAuthenticated]