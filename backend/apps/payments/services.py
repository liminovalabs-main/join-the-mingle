from decimal import Decimal
import logging
from typing import Any, Dict, Optional
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
            import sys
            is_testing = 'pytest' in sys.modules or 'test' in sys.argv
            if not getattr(settings, 'DEBUG', True) and not is_testing:
                raise ValueError("STRIPE_SECRET_KEY is not configured for production environment.")
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

        # Prices in pence (GBP cents)
        unit_amount_pence = int(booking.unit_price * 100)
        booking_fee_decimal = getattr(booking, 'booking_fee', Decimal('2.00'))
        booking_fee_pence = int(booking_fee_decimal * 100)

        venue_name = booking.mingle.venue.name if booking.mingle.venue else "London Venue"
        event_date_str = booking.mingle.event_date.strftime('%A, %d %B %Y')

        line_items = [
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
        ]

        if booking_fee_pence > 0:
            line_items.append({
                'price_data': {
                    'currency': 'gbp',
                    'unit_amount': booking_fee_pence,
                    'product_data': {
                        'name': 'Mingler Booking Fee',
                        'description': 'Reservation service & platform fee',
                    },
                },
                'quantity': 1,
            })

        session = stripe.checkout.Session.create(
            mode='payment',
            client_reference_id=str(booking.id),
            customer_email=booking.profile.user.email,
            line_items=line_items,
            metadata={
                'booking_id': str(booking.id),
                'user_id': str(booking.profile.user.id),
                'mingle_id': str(booking.mingle.id),
                'booking_fee': str(booking_fee_decimal),
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

    @classmethod
    def refund_payment(
        cls,
        payment,
        amount: Optional[Decimal] = None,
        reason: str = "requested_by_customer",
    ) -> Dict[str, Any]:
        """Issue a full or partial refund via Stripe API.

        Args:
            payment: The Payment model instance.
            amount: Optional Decimal amount in GBP. If None, full amount is refunded.
            reason: Stripe refund reason string.

        Returns:
            Dict containing refund_id, status, and refunded amount.
        """
        api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        intent_id = getattr(payment, 'stripe_payment_intent_id', '')

        # Mock / Sandbox fallback for test or offline environments
        if not api_key or api_key.startswith('sk_test_your_') or intent_id.startswith('pi_mock_'):
            refund_amount = amount or payment.amount_paid
            logger.info("Mock refund processed for Payment %s (£%s)", payment.id, refund_amount)
            return {
                'refund_id': f"re_mock_{payment.id.hex[:16]}",
                'status': 'succeeded',
                'amount': refund_amount,
            }

        stripe.api_key = api_key
        refund_params: Dict[str, Any] = {
            'payment_intent': intent_id,
            'reason': reason,
        }
        if amount:
            refund_params['amount'] = int(amount * 100)

        refund = stripe.Refund.create(**refund_params)
        refunded_decimal = (Decimal(refund.amount) / 100) if hasattr(refund, 'amount') else (amount or payment.amount_paid)
        logger.info(
            "Issued Stripe Refund %s for Payment %s (£%s, status: %s)",
            refund.id,
            payment.id,
            refunded_decimal,
            refund.status,
        )
        return {
            'refund_id': refund.id,
            'status': refund.status,
            'amount': refunded_decimal,
        }
