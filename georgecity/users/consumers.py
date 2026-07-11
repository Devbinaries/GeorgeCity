import json
from django.contrib.auth import get_user_model
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from marketplace.models import Chat

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

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
        text_data_json = json.loads(text_data)
        message_text = text_data_json.get('message', '').strip()
        sender_username = text_data_json.get('sender', '').strip()
        receiver_username = text_data_json.get('receiver', '').strip()

        if not message_text or not sender_username or not receiver_username:
            await self.send(text_data=json.dumps({
                'error': 'message, sender, and receiver are required.'
            }))
            return

        msg_data = await self.save_message(sender_username, receiver_username, message_text)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': msg_data
            }
        )

    @database_sync_to_async
    def save_message(self, sender_username, receiver_username, message_text):
        sender = User.objects.get(username=sender_username)
        receiver = User.objects.get(username=receiver_username)
        chat = Chat.objects.create(sender=sender, receiver=receiver, message=message_text)
        return {
            'id': chat.id,
            'sender': chat.sender.username,
            'receiver': chat.receiver.username,
            'message': chat.message,
            'reply': chat.reply,
        }

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))