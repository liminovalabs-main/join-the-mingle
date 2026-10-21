"""Stripe payment service wrapper for Project Mingler."""
import logging
from typing import Any, Dict
from django.conf import settings
import stripe

from apps.bookings.models import Booking

logger = logging.getLogger(__name__)


class StripeService:
    """Encapsulates interaction with the Stripe API Gateway."""

    @classmethod
    def create_checkout_session(
        cls,
        booking: Booking,
        success_url: str = None,
        cancel_url: str = None,
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout Session for a pending Booking reservation.

        Args:
            booking: The Booking model instance (must be status='pending').
            success_url: Optional frontend redirect URL on successful payment.
            cancel_url: Optional frontend redirect URL on cancelled payment.

        Returns:
            Dict containing session_id and checkout_url.
        """
        api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        if not api_key or api_key.startswith('sk_test_your_'):
            logger.warning("STRIPE_SECRET_KEY is not configured or placeholder; using fallback mock checkout session.")
            session_id = f"cs_mock_{booking.id.hex[:16]}"
            return {
                'session_id': session_id,
                'checkout_url': f"https://checkout.stripe.com/pay/{session_id}",
            }

        stripe.api_key = api_key

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        if not success_url:
            success_url = f"{frontend_url}/bookings/{booking.id}/success?session_id={{CHECKOUT_SESSION_ID}}"
        if not cancel_url:
            cancel_url = f"{frontend_url}/bookings/{booking.id}/cancelled"

        # Price in pence (GBP cents)
        unit_amount_pence = int(booking.unit_price * 100)

        venue_name = booking.mingle.venue.name if booking.mingle.venue else "London Venue"
        event_date_str = booking.mingle.event_date.strftime('%A, %d %B %Y')

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',
            client_reference_id=str(booking.id),
            customer_email=booking.profile.user.email,
            line_items=[
                {
                    'price_data': {
                        'currency': 'gbp',
                        'unit_amount': unit_amount_pence,
                        'product_data': {
                            'name': booking.mingle.title,
                            'description': (
                                f"{booking.places_booked} place(s) @ {venue_name} on {event_date_str}"
                            ),
                        },
                    },
                    'quantity': booking.places_booked,
                }
            ],
            metadata={
                'booking_id': str(booking.id),
                'user_id': str(booking.profile.user.id),
                'mingle_id': str(booking.mingle.id),
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )

        logger.info(
            "Created Stripe Checkout Session %s for Booking %s (Total £%s)",
            session.id,
            booking.id,
            booking.total_amount,
        )
        return {
            'session_id': session.id,
            'checkout_url': session.url,
        }
