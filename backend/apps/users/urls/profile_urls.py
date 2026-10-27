"""Profile URL patterns."""
from django.urls import path

from apps.users.views import MyProfileView, PublicProfileDetailView, PublicProfileListView

urlpatterns = [
    path('me/', MyProfileView.as_view(), name='profile-me'),
    path('public/', PublicProfileListView.as_view(), name='profile-public-list'),
    path('<uuid:id>/', PublicProfileDetailView.as_view(), name='profile-public-detail'),
]
