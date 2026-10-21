"""Booking service layer implementing concurrency-safe reservations and date guards.

Fixes Base44 Defect #3 (past-event bookings allowed) via strict Date Guard.
Prevents race-condition overbooking via PostgreSQL select_for_update() row locking.
"""
import logging
from typing import Optional
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import exceptions

from apps.bookings.models import Booking
from apps.mingles.models import Mingle
from apps.users.models import Profile

logger = logging.getLogger(__name__)


class BookingService:
    """Orchestrates atomic ticket reservation and lifecycle management."""

    @classmethod
    def calculate_spots_remaining(cls, mingle: Mingle) -> int:
        """Calculate real-time available spots for an event."""
        confirmed_places = (
            Booking.objects.filter(mingle=mingle, status='confirmed').aggregate(
                total=Sum('places_booked')
            )['total']
            or 0
        )
        return max(0, mingle.capacity - confirmed_places)

    @classmethod
    def create_booking(cls, profile: Profile, mingle_id: str, places_booked: int = 1) -> Booking:
        """Create a reservation with row-level pessimistic locking and past-date guard.

        Args:
            profile: Attendee's Profile
            mingle_id: UUID of the target Mingle
            places_booked: Number of seats (1-5)

        Returns:
            Newly created Booking with status='pending'

        Raises:
            ValidationError on capacity overflow, past events, or double bookings.
        """
        if places_booked < 1 or places_booked > 5:
            raise exceptions.ValidationError({'places_booked': "You can reserve between 1 and 5 tickets per booking."})

        # Atomic transaction with row-level lock on Mingle
        with transaction.atomic():
            try:
                # select_for_update() acquires an exclusive row lock until the transaction commits
                mingle = Mingle.objects.select_for_update().get(id=mingle_id)
            except Mingle.DoesNotExist:
                raise exceptions.ValidationError({'mingle_id': "Mingle event not found."})

            # 1. State Guard
            if mingle.status != 'published':
                raise exceptions.ValidationError({'mingle': "This experience is not currently open for bookings."})

            # 2. Past-Event Date Guard (Fixes Base44 Defect #3)
            now = timezone.now()
            today = now.date()
            if mingle.event_date < today:
                raise exceptions.ValidationError({
                    'mingle': "Cannot book tickets for past events. Please select an upcoming experience."
                })
            if mingle.event_date == today and mingle.start_time <= now.time():
                raise exceptions.ValidationError({
                    'mingle': "This event has already started today and can no longer be booked."
                })

            # 3. Duplicate Active Booking Guard
            existing_active = Booking.objects.filter(
                mingle=mingle,
                profile=profile,
                status__in=['pending', 'confirmed'],
            ).first()
            if existing_active:
                raise exceptions.ValidationError({
                    'non_field_errors': [
                        f"You already have a {existing_active.status} reservation for this event (Booking #{str(existing_active.id)[:8]})."
                    ]
                })

            # 4. Concurrency-Safe Capacity Guard
            reserved_places = (
                Booking.objects.filter(mingle=mingle, status__in=['pending', 'confirmed']).aggregate(
                    total=Sum('places_booked')
                )['total']
                or 0
            )

            available_places = mingle.capacity - reserved_places
            if places_booked > available_places:
                raise exceptions.ValidationError({
                    'places_booked': (
                        f"Not enough seats available. Only {available_places} seat(s) remain for this event."
                        if available_places > 0
                        else "Not enough seats available. This event is completely sold out."
                    )
                })

            # 5. Price Snapshotting and Creation
            unit_price = mingle.ticket_price
            total_amount = unit_price * places_booked

            booking = Booking.objects.create(
                mingle=mingle,
                profile=profile,
                places_booked=places_booked,
                unit_price=unit_price,
                total_amount=total_amount,
                status='pending',
            )

            logger.info(
                "Created pending Booking %s for Profile %s (%d places @ £%s)",
                booking.id,
                profile.display_name,
                places_booked,
                total_amount,
            )
            return booking

    @classmethod
    def cancel_booking(cls, booking: Booking, profile: Profile) -> Booking:
        """Cancel an upcoming reservation and release capacity."""
        if booking.profile != profile:
            raise exceptions.PermissionDenied("You do not have permission to cancel this booking.")

        if booking.status == 'cancelled':
            raise exceptions.ValidationError({'booking': "This booking has already been cancelled."})

        if booking.status == 'refunded':
            raise exceptions.ValidationError({'booking': "This booking has already been refunded."})

        # Cannot cancel events that have already taken place
        today = timezone.now().date()
        if booking.mingle.event_date < today:
            raise exceptions.ValidationError({'booking': "Cannot cancel a booking for an event that has already occurred."})

        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
        logger.info("Cancelled Booking %s for Profile %s", booking.id, profile.display_name)
        return booking
