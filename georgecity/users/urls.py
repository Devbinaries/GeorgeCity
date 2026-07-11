from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FarmerViewSet, ConsumerViewSet, DriverViewSet,ConsumerSearchView,
    FarmerSearchView,DriverSearchView,LoginView,FarmerRegistrationView,ConsumerRegistrationView,
    DriverRegistrationView, ProfileView, UserProfileView
)

app_name = 'users'

router = DefaultRouter()
router.register(r'farmers', FarmerViewSet, basename='farmer')
router.register(r'consumers', ConsumerViewSet, basename='consumer')
router.register(r'drivers', DriverViewSet, basename='driver')


urlpatterns = [
    path('', include(router.urls)),
    path('farmer/search/', FarmerSearchView.as_view(),name='farmer-search'),
    path('consumers/search/', ConsumerSearchView.as_view(),name='consumer-search'),
    path('driver/search/', DriverSearchView.as_view(),name='driver-search'),
    path('signin/',LoginView.as_view(), name='login'),
    path('login/',LoginView.as_view(), name='login-alias'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('by-username/<str:username>/', UserProfileView.as_view(), name='user-by-username'),
    path('signup/farmer/',FarmerRegistrationView.as_view(), name='farmer'),
    path('signup/consumer/',ConsumerRegistrationView.as_view(),name='consumer'),
    path('signup/driver/',DriverRegistrationView.as_view(),name='driver'),
    path('driver/signup/',DriverRegistrationView.as_view(),name='driver-alias')
]
