import json
from channels.generic.websocket import AsyncWebsocketConsumer



class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await  self.accept()

    async def disconnect(self, close_code):
        pass

    async def recieve(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        await self.channel_layer.group_send("notifications", {
            "type": "notifications.message",
            "message": message
        })

    async def notifications(self, event):{
        await self.send(text_data=json.dumps(event))
    }


class PostsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        await self.channel_layer.group_send("posts", {
            "type": "posts.message",
            "message": message
        })

    async def posts_message(self, event):
        await self.send(text_data=json.dumps(event))
