"""URL patterns for the Venues domain."""
from django.urls import path
from apps.interactions.views import VenueReviewCreateView
from apps.mingles.views import VenueMingleListView
from apps.venues.views import (
    MyVenuesListView,
    VenueDetailView,
    VenueListView,
    VenueOpeningHoursUpdateView,
    VenueRegisterView,
    VenueUpdateView,
)

urlpatterns = [
    # Venue Registration & Management
    path('register/', VenueRegisterView.as_view(), name='venue-register'),
    path('mine/', MyVenuesListView.as_view(), name='venue-mine'),
    path('<uuid:id>/hours/', VenueOpeningHoursUpdateView.as_view(), name='venue-hours-update'),
    path('<uuid:venue_id>/mingles/', VenueMingleListView.as_view(), name='venue-mingles'),

    # Public Venues Directory & Detail
    path('', VenueListView.as_view(), name='venue-list'),
    path('<str:slug>/', VenueDetailView.as_view(), name='venue-detail'),
    path('<str:slug>/reviews/', VenueReviewCreateView.as_view(), name='venue-reviews'),
]
