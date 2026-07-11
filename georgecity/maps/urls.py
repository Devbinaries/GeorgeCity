from django.urls import path
from .views import MapConfigView

app_name = 'maps'

urlpatterns = [
    path('config/', MapConfigView.as_view(), name='map-config'),
]
