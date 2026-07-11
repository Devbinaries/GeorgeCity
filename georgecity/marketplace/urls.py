from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from .views import HireRequestViewSet

app_name = 'marketplace'

router = DefaultRouter()

router.register(r'farms', views.FarmViewSet, basename='farmviewset')
router.register(r'products', views.FarmProductViewSet, basename='productviewset')
router.register(r'orders', views.OrderViewSet, basename='orderviewset')
router.register(r'order-items', views.OrderItemViewSet, basename='orderitemviewset')
router.register(r'posts', views.PostsViewSet, basename='postsviewset')
router.register(r'post-engagement', views.PostEngagementViewSet, basename='postengagementviewset')
router.register(r'chats', views.ChatViewSet, basename='chatviewset')
router.register(r'hire-requests', HireRequestViewSet, basename='hirerequestviewset')


urlpatterns = [
    path('', include(router.urls)),
    #path('farms/search/', views.FarmSearchView.as_view(), name='farm-search'),
]
