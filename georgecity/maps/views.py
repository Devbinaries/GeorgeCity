from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings

class MapConfigView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            "google_maps_api_key": getattr(settings, "GOOGLE_MAPS_API_KEY", "")
        })
