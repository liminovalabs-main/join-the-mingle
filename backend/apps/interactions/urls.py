"""URL configuration for the Interactions app."""
from django.urls import path
from apps.interactions.views import ConnectionCelebrateView, ConnectionListView

urlpatterns = [
    path('connections/', ConnectionListView.as_view(), name='connection-list'),
    path('connections/<uuid:id>/celebrate/', ConnectionCelebrateView.as_view(), name='connection-celebrate'),
]
