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
            if hasattr(user, 'farmer'):
                user_type = 'farmer'
            elif hasattr(user, 'consumer'):
                user_type = 'consumer'
            elif hasattr(user, 'driver'):
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

        if hasattr(user, 'farmer'):
            serializer = FarmerSerializer(user.farmer)
            user_type = 'farmer'
        elif hasattr(user, 'consumer'):
            serializer = ConsumerSerializer(user.consumer)
            user_type = 'consumer'
        elif hasattr(user, 'driver'):
            serializer = DriverSerializer(user.driver)
            user_type = 'driver'
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

        data = serializer.data
        data['user_type'] = user_type
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user

        if hasattr(user, 'farmer'):
            instance = user.farmer
            serializer_class = FarmerSerializer
            user_type = 'farmer'
        elif hasattr(user, 'consumer'):
            instance = user.consumer
            serializer_class = ConsumerSerializer
            user_type = 'consumer'
        elif hasattr(user, 'driver'):
            instance = user.driver
            serializer_class = DriverSerializer
            user_type = 'driver'
        else:
            return Response({'error': 'Update not supported for base user'}, status=status.HTTP_400_BAD_REQUEST)

        # Remove existing photo URL if it was not modified
        data = request.data.copy()
        if 'photo' in data and isinstance(data['photo'], str) and (data['photo'].startswith('http') or data['photo'].startswith('/') or not data['photo']):
            data.pop('photo')

        serializer = serializer_class(instance, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_data = serializer.data
            response_data['user_type'] = user_type
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [authentication.JWTAuthentication]

    def get(self, request, username):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user_type = 'consumer'
        if hasattr(user, 'farmer'):
            user_type = 'farmer'
        elif hasattr(user, 'driver'):
            user_type = 'driver'
            
        return Response({
            'username': user.username,
            'user_type': user_type,
        }, status=status.HTTP_200_OK)