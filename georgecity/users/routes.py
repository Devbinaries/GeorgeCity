from django.urls import path
from . import consumers as user_consumers
from maps import consumers as maps_consumers


websocket_urlpatterns = [
    path('ws/chat/<str:room_name>/', user_consumers.ChatConsumer.as_asgi()),
    path('ws/track/<int:order_id>/', maps_consumers.OrderTrackingConsumer.as_asgi()),
]