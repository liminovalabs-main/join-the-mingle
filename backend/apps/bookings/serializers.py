"""Serializers for the Bookings domain."""
import uuid
from typing import Any, Dict
from rest_framework import serializers

from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.mingles.serializers import MingleListSerializer
from apps.users.models import Profile


class CreateBookingSerializer(serializers.Serializer):
    """Serializer for reserving seats for a Mingle experience."""

    mingle_id = serializers.UUIDField(required=True, help_text="UUID of the Mingle event.")
    places_booked = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        max_value=5,
        help_text="Number of seats to reserve (1 to 5).",
    )

    def save(self, profile: Profile) -> Booking:
        mingle_id = str(self.validated_data['mingle_id'])
        places_booked = self.validated_data.get('places_booked', 1)
        return BookingService.create_booking(
            profile=profile,
            mingle_id=mingle_id,
            places_booked=places_booked,
        )


class BookingDetailSerializer(serializers.ModelSerializer):
    """Full booking detail serializer with embedded Mingle event snapshot."""

    mingle = MingleListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'mingle',
            'places_booked',
            'unit_price',
            'total_amount',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'mingle',
            'places_booked',
            'unit_price',
            'total_amount',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]


class BookingCancelSerializer(serializers.Serializer):
    """Serializer for cancelling an existing booking."""

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text="Optional reason for cancellation.",
    )
