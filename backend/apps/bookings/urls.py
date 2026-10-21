"""URL patterns for the Bookings domain."""
from django.urls import path
from apps.bookings.views import (
    BookingCancelView,
    BookingCreateView,
    BookingDetailView,
    MyBookingsListView,
)
from apps.payments.views import StripeCheckoutView

urlpatterns = [
    path('', BookingCreateView.as_view(), name='booking-create'),
    path('my-bookings/', MyBookingsListView.as_view(), name='booking-my-list'),
    path('<uuid:id>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:id>/checkout/', StripeCheckoutView.as_view(), name='booking-checkout'),
    path('<uuid:id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
]
