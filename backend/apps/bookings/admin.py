"""Django admin configuration for Booking models."""
from django.contrib import admin

from apps.bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'profile', 'mingle', 'places_booked', 'total_amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('profile__display_name', 'mingle__title')
    readonly_fields = ('unit_price', 'total_amount')
