import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class OrderTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_tracking_{self.order_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        lat = data.get('latitude')
        lng = data.get('longitude')
        status_val = data.get('status')

        # Save driver location update to DB
        if lat is not None and lng is not None:
            await self.update_driver_location(self.order_id, lat, lng, status_val)

        # Broadcast update to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'location_update',
                'order_id': self.order_id,
                'latitude': lat,
                'longitude': lng,
                'status': status_val
            }
        )

    async def location_update(self, event):
        # Send location update to WebSocket
        await self.send(text_data=json.dumps({
            'order_id': event['order_id'],
            'latitude': event['latitude'],
            'longitude': event['longitude'],
            'status': event['status']
        }))

    @database_sync_to_async
    def update_driver_location(self, order_id, lat, lng, status_val):
        from marketplace.models import Order
        try:
            order = Order.objects.get(id=order_id)
            order.driver_latitude = lat
            order.driver_longitude = lng
            if status_val:
                order.status = status_val
            order.save()
        except Order.DoesNotExist:
            pass