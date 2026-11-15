"""Comprehensive Automated Tests for Stripe Integration Upgrades.

Covers:
1. Booking Fee Calculation (£2.00 added to total_amount).
2. Stripe Checkout Session line item generation (tickets + £2 fee).
3. 48-Hour Cancellation Window Enforcement (>48h full refund, <48h non-refundable).
4. Venue cancellation / host-declined override (<48h still eligible for full refund).
5. Confirmed booking cancellation triggering Stripe refund.
6. Webhook Dual-Secret Signature Verification (live and test secret support).
7. Webhook `charge.refunded` event handling.
8. Webhook idempotency protection (replay defense).
"""
from datetime import date, time, timedelta
from decimal import Decimal
import json
from unittest.mock import MagicMock, patch

from django.test import override_settings
from django.utils import timezone
import pytest
from rest_framework import exceptions, status
from rest_framework.test import APIClient
import stripe

from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.mingles.models import Mingle
from apps.payments.models import Payment, StripePaymentEvent
from apps.payments.services import StripeService
from apps.users.models import User
from apps.venues.models import Venue


@pytest.fixture
def venue(db):
    return Venue.objects.create(
        name="Bon Bon Pottery",
        slug="bon-bon-pottery-battersea",
        category="Crafts & Arts",
        area="Battersea",
        address="Battersea Power Station",
        postcode="SW11 8BZ",
        description="London ceramics and pottery studio.",
        status="approved",
        commission_rate=15.00,
    )


@pytest.fixture
def member_user(db):
    user = User.objects.create_user(email="member.test@mingler.co.uk", password="password123")
    user.profile.display_name = "Alex Tester"
    user.profile.save()
    return user


@pytest.fixture
def future_mingle_3days(db, venue):
    """Mingle scheduled 3 days into the future (well outside 48h cutoff)."""
    future_date = timezone.now().date() + timedelta(days=3)
    return Mingle.objects.create(
        venue=venue,
        title="Pottery Painting & Drinks",
        experience_type="cultural",
        event_date=future_date,
        start_time=time(18, 30),
        duration_minutes=90,
        ticket_price=Decimal("32.00"),
        capacity=12,
        cancellation_cutoff_hours=48,
        status="published",
    )


@pytest.fixture
def imminent_mingle_24h(db, venue):
    """Mingle scheduled tomorrow (within the 48h non-refundable cutoff)."""
    tomorrow = timezone.now().date() + timedelta(days=1)
    return Mingle.objects.create(
        venue=venue,
        title="Last Minute Pottery Social",
        experience_type="cultural",
        event_date=tomorrow,
        start_time=time(14, 0),
        duration_minutes=90,
        ticket_price=Decimal("30.00"),
        capacity=10,
        cancellation_cutoff_hours=48,
        status="published",
    )


@pytest.mark.django_db
class TestBookingFeeAndStripeCheckout:
    """Test £2.00 booking fee calculation and Checkout Session line items."""

    def test_booking_creation_calculates_booking_fee(self, member_user, future_mingle_3days):
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=2,
        )

        assert booking.places_booked == 2
        assert booking.unit_price == Decimal("32.00")
        assert booking.booking_fee == Decimal("2.00")
        # Total should be (32 * 2) + 2 = 66.00
        assert booking.total_amount == Decimal("66.00")
        assert booking.status == "pending"

    @patch("stripe.checkout.Session.create")
    def test_stripe_checkout_session_contains_booking_fee_line_item(
        self, mock_session_create, member_user, future_mingle_3days
    ):
        mock_session_create.return_value = MagicMock(
            id="cs_test_12345",
            url="https://checkout.stripe.com/pay/cs_test_12345",
        )

        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=2,
        )

        with override_settings(STRIPE_SECRET_KEY="rk_test_dummy_key"):
            result = StripeService.create_checkout_session(booking)

        assert result["session_id"] == "cs_test_12345"
        mock_session_create.assert_called_once()
        kwargs = mock_session_create.call_args[1]
        line_items = kwargs["line_items"]

        # Should contain 2 line items: tickets and £2 booking fee
        assert len(line_items) == 2
        # Ticket item
        assert line_items[0]["price_data"]["unit_amount"] == 3200
        assert line_items[0]["quantity"] == 2
        # Booking fee item
        assert line_items[1]["price_data"]["unit_amount"] == 200
        assert line_items[1]["quantity"] == 1
        assert line_items[1]["price_data"]["product_data"]["name"] == "Mingler Booking Fee"


@pytest.mark.django_db
class TestCancellationAndRefundPolicy:
    """Test 48-hour cancellation policy and refund execution."""

    def test_cancellation_allowed_more_than_48h_before_event(self, member_user, future_mingle_3days):
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=1,
        )
        cancelled = BookingService.cancel_booking(booking=booking, profile=member_user.profile)
        assert cancelled.status == "cancelled"

    def test_cancellation_within_48h_raises_validation_error(self, member_user, imminent_mingle_24h):
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(imminent_mingle_24h.id),
            places_booked=1,
        )
        with pytest.raises(exceptions.ValidationError) as exc_info:
            BookingService.cancel_booking(booking=booking, profile=member_user.profile)
        assert "48 hours" in str(exc_info.value)
        assert "non-refundable" in str(exc_info.value)

    def test_cancellation_within_48h_allowed_if_venue_cancels(self, member_user, imminent_mingle_24h):
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(imminent_mingle_24h.id),
            places_booked=1,
        )
        cancelled = BookingService.cancel_booking(
            booking=booking,
            profile=member_user.profile,
            is_venue_cancellation=True,
        )
        assert cancelled.status == "cancelled"

    def test_confirmed_booking_cancellation_triggers_refund(self, member_user, future_mingle_3days):
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=1,
        )
        booking.status = "confirmed"
        booking.save()

        payment = Payment.objects.create(
            booking=booking,
            stripe_checkout_session_id="cs_test_mock",
            stripe_payment_intent_id="pi_mock_12345",
            amount_paid=booking.total_amount,
            currency="GBP",
            payment_status="succeeded",
        )

        with patch.object(StripeService, "refund_payment") as mock_refund:
            mock_refund.return_value = {
                "refund_id": "re_test_999",
                "status": "succeeded",
                "amount": booking.total_amount,
            }
            cancelled = BookingService.cancel_booking(booking=booking, profile=member_user.profile)

        assert cancelled.status == "refunded"
        payment.refresh_from_db()
        assert payment.payment_status == "refunded"
        assert payment.refund_id == "re_test_999"


@pytest.mark.django_db
class TestStripeWebhookUpgrades:
    """Test webhook receiver dual-secret verification, refunds, and idempotency."""

    def test_webhook_dual_secret_verification(self, client, member_user, future_mingle_3days):
        """Webhook verifies properly using STRIPE_TEST_WEBHOOK_SECRET."""
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=1,
        )

        event_payload = {
            "id": "evt_test_checkout_completed_001",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_webhook_session",
                    "client_reference_id": str(booking.id),
                    "amount_total": int(booking.total_amount * 100),
                    "payment_intent": "pi_test_webhook_intent",
                }
            },
        }

        with override_settings(
            STRIPE_WEBHOOK_SECRET="whsec_live_dummy_secret",
            STRIPE_TEST_WEBHOOK_SECRET="whsec_test_dummy_secret",
        ):
            with patch("stripe.Webhook.construct_event") as mock_construct:
                # First call (with live secret) fails, second call (with test secret) succeeds
                def side_effect(payload, sig, secret):
                    if secret == "whsec_test_dummy_secret":
                        return event_payload
                    raise stripe.error.SignatureVerificationError("Signature mismatch", sig)

                mock_construct.side_effect = side_effect

                response = client.post(
                    "/api/v1/payments/webhook/",
                    data=json.dumps(event_payload),
                    content_type="application/json",
                    HTTP_STRIPE_SIGNATURE="t=123,v1=test_signature",
                )

        assert response.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        assert booking.status == "confirmed"

    def test_webhook_charge_refunded_event_updates_booking(self, client, member_user, future_mingle_3days):
        """charge.refunded webhook updates booking and payment records to refunded."""
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=1,
        )
        booking.status = "confirmed"
        booking.save()

        payment = Payment.objects.create(
            booking=booking,
            stripe_checkout_session_id="cs_test_session_ref",
            stripe_payment_intent_id="pi_test_intent_to_refund",
            amount_paid=booking.total_amount,
            currency="GBP",
            payment_status="succeeded",
        )

        refund_payload = {
            "id": "evt_test_charge_refunded_002",
            "type": "charge.refunded",
            "data": {
                "object": {
                    "id": "ch_test_charge",
                    "payment_intent": "pi_test_intent_to_refund",
                    "amount_refunded": int(booking.total_amount * 100),
                }
            },
        }

        with override_settings(STRIPE_WEBHOOK_SECRET="", STRIPE_TEST_WEBHOOK_SECRET=""):
            response = client.post(
                "/api/v1/payments/webhook/",
                data=json.dumps(refund_payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_200_OK
        booking.refresh_from_db()
        payment.refresh_from_db()

        assert booking.status == "refunded"
        assert payment.payment_status == "refunded"
        assert payment.amount_refunded == booking.total_amount

    def test_webhook_idempotency_prevents_duplicate_processing(self, client, member_user, future_mingle_3days):
        """Same event ID received twice is acknowledged without double processing."""
        booking = BookingService.create_booking(
            profile=member_user.profile,
            mingle_id=str(future_mingle_3days.id),
            places_booked=1,
        )

        event_payload = {
            "id": "evt_test_idempotent_003",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_idempotent",
                    "client_reference_id": str(booking.id),
                    "amount_total": int(booking.total_amount * 100),
                    "payment_intent": "pi_test_idempotent",
                }
            },
        }

        with override_settings(STRIPE_WEBHOOK_SECRET="", STRIPE_TEST_WEBHOOK_SECRET=""):
            # First delivery
            res1 = client.post(
                "/api/v1/payments/webhook/",
                data=json.dumps(event_payload),
                content_type="application/json",
            )
            assert res1.status_code == status.HTTP_200_OK

            # Second delivery (duplicate)
            res2 = client.post(
                "/api/v1/payments/webhook/",
                data=json.dumps(event_payload),
                content_type="application/json",
            )
            assert res2.status_code == status.HTTP_200_OK
            assert "Duplicate event" in res2.data.get("detail", "")
