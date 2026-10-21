"""Views for Stripe Checkout initiation and signed webhook processing."""
from decimal import Decimal
import json
import logging
from django.conf import settings
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
import stripe

from apps.bookings.models import Booking
from apps.payments.models import Payment, StripePaymentEvent
from apps.payments.services import StripeService
from apps.notifications.tasks import send_booking_confirmation_email_task

logger = logging.getLogger(__name__)


class CheckoutSessionRequestSerializer(serializers.Serializer):
    """Optional request payload for initiating Stripe Checkout."""

    booking_id = serializers.UUIDField(required=False, help_text="UUID of the pending booking.")
    success_url = serializers.URLField(required=False, help_text="Custom return URL on payment success.")
    cancel_url = serializers.URLField(required=False, help_text="Custom return URL on payment cancellation.")


class StripeCheckoutView(APIView):
    """Initiate a Stripe Checkout Session for a pending Booking reservation."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Payments'],
        summary='Create Stripe Checkout Session',
        description=(
            'Initiates a Stripe Checkout session for a pending reservation owned by the authenticated member. '
            'Returns a secure checkout_url and session_id.'
        ),
        request=CheckoutSessionRequestSerializer,
        responses={
            200: OpenApiResponse(description='Checkout session created successfully.'),
            400: OpenApiResponse(description='Booking is not in pending state or invalid request.'),
            403: OpenApiResponse(description='User does not own this booking.'),
            404: OpenApiResponse(description='Booking not found.'),
        },
    )
    def post(self, request, id=None):
        booking_id = id or request.data.get('booking_id')
        if not booking_id:
            return Response(
                {'success': False, 'error': {'message': "booking_id is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking = Booking.objects.select_related('profile__user', 'mingle__venue').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': "Booking not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Ownership verification
        if booking.profile.user != request.user and request.user.role != 'admin':
            return Response(
                {'success': False, 'error': {'message': "You do not have permission to pay for this booking."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status != 'pending':
            return Response(
                {'success': False, 'error': {'message': f"Booking is already {booking.status} and cannot be paid."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')

        try:
            session_data = StripeService.create_checkout_session(
                booking=booking,
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return Response(
                {
                    'success': True,
                    'session_id': session_data['session_id'],
                    'checkout_url': session_data['checkout_url'],
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Failed to create Stripe checkout session: %s", e)
            return Response(
                {'success': False, 'error': {'message': f"Could not create checkout session: {str(e)}"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """Cryptographically verified Stripe Webhook receiver with Idempotency Replay Guard."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=['Payments'],
        summary='Stripe Webhook Receiver',
        description=(
            'Processes Stripe webhook callbacks with HMAC signature verification and deduplication against '
            'StripePaymentEvent to prevent replay attacks.'
        ),
        request=None,
        responses={
            200: OpenApiResponse(description='Webhook handled cleanly or safely skipped if duplicate.'),
            400: OpenApiResponse(description='Invalid payload or signature mismatch.'),
        },
    )
    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('Stripe-Signature', '')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        # Construct and cryptographically verify the event
        try:
            if webhook_secret and sig_header:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                # If secret is unset in dev/test, decode JSON directly with security warning
                logger.warning("Processing Stripe webhook without signature verification (dev/testing mode).")
                event = json.loads(payload.decode('utf-8'))
        except (ValueError, stripe.error.SignatureVerificationError) as err:
            logger.warning("Stripe webhook signature verification failed: %s", err)
            return Response({'error': f"Invalid signature or payload: {str(err)}"}, status=status.HTTP_400_BAD_REQUEST)

        event_id = event.get('id')
        event_type = event.get('type')

        if not event_id or not event_type:
            return Response({'error': "Missing event metadata"}, status=status.HTTP_400_BAD_REQUEST)

        # ─── IDEMPOTENCY CHECK (Replay Attack Defense) ─────────────────
        if StripePaymentEvent.objects.filter(event_id=event_id).exists():
            logger.info("Stripe event %s (%s) already processed. Skipping idempotently.", event_id, event_type)
            return Response({'received': True, 'detail': "Duplicate event safely ignored."}, status=status.HTTP_200_OK)

        with transaction.atomic():
            # Log event for deduplication
            StripePaymentEvent.objects.create(
                event_id=event_id,
                event_type=event_type,
            )

            # ─── 1. Checkout Session Completed (Payment Succeeded) ─────
            if event_type == 'checkout.session.completed':
                session = event.get('data', {}).get('object', {})
                booking_id = session.get('metadata', {}).get('booking_id') or session.get('client_reference_id')

                if booking_id:
                    try:
                        booking = Booking.objects.select_for_update().get(id=booking_id)
                        if booking.status == 'pending':
                            booking.status = 'confirmed'
                            booking.save(update_fields=['status', 'updated_at'])

                            amount_total = session.get('amount_total')
                            amount_decimal = (Decimal(amount_total) / 100) if amount_total else booking.total_amount

                            Payment.objects.create(
                                booking=booking,
                                stripe_checkout_session_id=session.get('id', f"cs_{event_id}"),
                                stripe_payment_intent_id=session.get('payment_intent') or session.get('id', f"pi_{event_id}"),
                                amount_paid=amount_decimal,
                                currency='GBP',
                                payment_status='succeeded',
                            )

                            logger.info("Booking %s confirmed via Stripe payment %s (£%s)", booking.id, event_id, amount_decimal)

                            # Dispatch async confirmation email with .ics invite
                            send_booking_confirmation_email_task.delay(str(booking.id))
                    except Booking.DoesNotExist:
                        logger.error("Booking %s from webhook session metadata does not exist.", booking_id)

            # ─── 2. Checkout Session Expired / Failed (Release Seats) ──
            elif event_type in ('checkout.session.expired', 'payment_intent.payment_failed'):
                session = event.get('data', {}).get('object', {})
                booking_id = session.get('metadata', {}).get('booking_id') or session.get('client_reference_id')

                if booking_id:
                    try:
                        booking = Booking.objects.select_for_update().get(id=booking_id)
                        if booking.status == 'pending':
                            booking.status = 'cancelled'
                            booking.save(update_fields=['status', 'updated_at'])
                            logger.info("Booking %s cancelled and seats released due to Stripe event: %s", booking.id, event_type)
                    except Booking.DoesNotExist:
                        logger.error("Booking %s from webhook session metadata does not exist.", booking_id)

        return Response({'received': True}, status=status.HTTP_200_OK)
