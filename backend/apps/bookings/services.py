"""Booking service layer implementing concurrency-safe reservations and date guards.

Fixes Base44 Defect #3 (past-event bookings allowed) via strict Date Guard.
Prevents race-condition overbooking via PostgreSQL select_for_update() row locking.
"""
import logging
from datetime import datetime
from decimal import Decimal
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

            # 5. Price Snapshotting and Creation with £2 Booking Fee
            unit_price = mingle.ticket_price
            booking_fee = Decimal('2.00')
            total_amount = (unit_price * places_booked) + booking_fee

            booking = Booking.objects.create(
                mingle=mingle,
                profile=profile,
                places_booked=places_booked,
                unit_price=unit_price,
                booking_fee=booking_fee,
                total_amount=total_amount,
                status='pending',
            )

            logger.info(
                "Created pending Booking %s for Profile %s (%d places @ £%s + £%s fee = £%s)",
                booking.id,
                profile.display_name,
                places_booked,
                unit_price,
                booking_fee,
                total_amount,
            )
            return booking

    @classmethod
    def cancel_booking(
        cls,
        booking: Booking,
        profile: Profile,
        is_venue_cancellation: bool = False,
        is_host_declined: bool = False,
    ) -> Booking:
        """Cancel an upcoming reservation and release capacity according to refund policy.

        Policy:
            - Greater than cancellation_cutoff_hours (default 48h): Full refund including booking fee.
            - Within cancellation_cutoff_hours: Non-refundable (unless cancelled by venue/host).
            - Venue cancellation or host declined: Always eligible for full refund.
        """
        user = profile.user
        is_admin_or_staff = user.is_staff or user.role == 'admin'

        if booking.profile != profile and not is_admin_or_staff:
            raise exceptions.PermissionDenied("You do not have permission to cancel this booking.")

        if booking.status == 'cancelled':
            raise exceptions.ValidationError({'booking': "This booking has already been cancelled."})

        if booking.status == 'refunded':
            raise exceptions.ValidationError({'booking': "This booking has already been refunded."})

        # Calculate cutoff window relative to mingle start time
        now = timezone.now()
        event_time = booking.mingle.start_time
        event_datetime = datetime.combine(booking.mingle.event_date, event_time)
        if timezone.is_naive(event_datetime):
            event_datetime = timezone.make_aware(event_datetime, timezone.get_current_timezone())

        if now >= event_datetime:
            raise exceptions.ValidationError({'booking': "Cannot cancel a booking for an event that has already occurred or started."})

        cutoff_hours = getattr(booking.mingle, 'cancellation_cutoff_hours', 48)
        hours_until_event = (event_datetime - now).total_seconds() / 3600.0

        is_exempt_from_cutoff = is_venue_cancellation or is_host_declined or is_admin_or_staff

        if not is_exempt_from_cutoff and hours_until_event < cutoff_hours:
            raise exceptions.ValidationError({
                'booking': (
                    f"Cancellations within {cutoff_hours} hours of the event start are non-refundable "
                    "under Mingler's cancellation policy."
                )
            })

        # Process refund if payment was already captured
        if booking.status == 'confirmed':
            payment = getattr(booking, 'payment', None)
            if payment and payment.payment_status == 'succeeded':
                from apps.payments.services import StripeService
                refund_result = StripeService.refund_payment(payment, reason="requested_by_customer")
                payment.payment_status = 'refunded'
                payment.refund_id = refund_result.get('refund_id')
                payment.amount_refunded = refund_result.get('amount', payment.amount_paid)
                payment.save(update_fields=['payment_status', 'refund_id', 'amount_refunded', 'updated_at'])
                booking.status = 'refunded'
                booking.save(update_fields=['status', 'updated_at'])
                logger.info("Refunded Booking %s and Payment %s for Profile %s (£%s)", booking.id, payment.id, profile.display_name, payment.amount_paid)
                return booking

        booking.status = 'cancelled'
        booking.save(update_fields=['status', 'updated_at'])
        logger.info("Cancelled Booking %s for Profile %s", booking.id, profile.display_name)
        return booking
