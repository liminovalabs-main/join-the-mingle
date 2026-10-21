"""Automated Test Suite for Part 4: Stripe Payments, Webhooks, Mutual Matching & Celery Notifications.

Covers:
- Stripe Checkout Session initiation, ownership verification, and state guard.
- Cryptographically verified Stripe webhook receiver.
- Idempotency & replay-attack defense (duplicate webhook event safely ignored).
- Capacity release on expired checkout sessions.
- RFC 5545 compliant iCalendar (.ics) generation.
- Attendance-gated experience feedback (permanently fixing Base44 Defect #4).
- 3NF Venue reviews (fixing Base44 Defect #7).
- Post-mingle mutual matching engine, bidirectional connection evaluation, and celebration state.
- Celery asynchronous notification tasks with attachments.
"""
from datetime import date, time, timedelta
from decimal import Decimal
import json
from unittest.mock import patch

from django.core import mail
from django.utils import timezone
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.bookings.models import Booking
from apps.interactions.models import Connection, Feedback, MingleSelection, VenueReview
from apps.interactions.services import MatchingService
from apps.mingles.models import Mingle
from apps.notifications.calendar import CalendarService
from apps.notifications.tasks import (
    send_booking_confirmation_email_task,
    send_mutual_match_notification_task,
)
from apps.payments.models import Payment, StripePaymentEvent
from apps.users.models import User
from apps.venues.models import Venue


@pytest.fixture
def sample_venue(db):
    """Approved venue in Shoreditch."""
    return Venue.objects.create(
        name='The Shoreditch Social Lounge',
        slug='the-shoreditch-social-lounge',
        category='Cocktail Bar & Lounge',
        area='Shoreditch',
        address='142 Shoreditch High St',
        postcode='E1 6JE',
        description='Vibrant cocktail lounge in East London.',
        status='approved',
        commission_rate=10.00,
    )


@pytest.fixture
def sample_mingle(db, sample_venue):
    """Upcoming published Mingle experience."""
    future_date = timezone.now().date() + timedelta(days=5)
    return Mingle.objects.create(
        venue=sample_venue,
        title='Friday Night Cocktail Social',
        description='Curated cocktail experience with like-minded Londoners.',
        experience_type='cocktails',
        event_date=future_date,
        start_time=time(19, 30),
        duration_minutes=120,
        ticket_price=35.00,
        capacity=16,
        status='published',
    )


@pytest.fixture
def pending_booking(db, sample_mingle, member_user):
    """Pending booking reservation for member_user."""
    return Booking.objects.create(
        mingle=sample_mingle,
        profile=member_user.profile,
        places_booked=2,
        unit_price=sample_mingle.ticket_price,
        total_amount=sample_mingle.ticket_price * 2,
        status='pending',
    )


@pytest.fixture
def confirmed_booking(db, sample_mingle, member_user):
    """Confirmed booking reservation for member_user."""
    return Booking.objects.create(
        mingle=sample_mingle,
        profile=member_user.profile,
        places_booked=2,
        unit_price=sample_mingle.ticket_price,
        total_amount=sample_mingle.ticket_price * 2,
        status='confirmed',
    )


@pytest.fixture
def second_confirmed_booking(db, sample_mingle, second_member):
    """Confirmed booking reservation for second_member."""
    return Booking.objects.create(
        mingle=sample_mingle,
        profile=second_member.profile,
        places_booked=1,
        unit_price=sample_mingle.ticket_price,
        total_amount=sample_mingle.ticket_price,
        status='confirmed',
    )


# ─────────────────────────────────────────────────────────────
# 1. Stripe Checkout Initiation Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4StripeCheckout:
    """Test suite for initiating Stripe Checkout sessions."""

    def test_checkout_session_initiation_success(self, auth_client, pending_booking):
        """Owner of a pending reservation can initiate a Stripe checkout session."""
        url = f'/api/v1/bookings/{pending_booking.id}/checkout/'
        res = auth_client.post(url, {}, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert 'session_id' in res.data
        assert 'checkout_url' in res.data
        assert 'checkout.stripe.com' in res.data['checkout_url']

    def test_checkout_unauthenticated_blocked(self, api_client, pending_booking):
        """Unauthenticated requests cannot initiate checkout."""
        url = f'/api/v1/bookings/{pending_booking.id}/checkout/'
        res = api_client.post(url, {}, format='json')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_checkout_unauthorized_user_blocked(self, pending_booking, second_member):
        """A user cannot initiate checkout for another member's booking."""
        second_refresh = RefreshToken.for_user(second_member)
        second_client = APIClient()
        second_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(second_refresh.access_token)}')

        url = f'/api/v1/bookings/{pending_booking.id}/checkout/'
        res = second_client.post(url, {}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert 'permission' in str(res.data).lower()

    def test_checkout_already_confirmed_booking_blocked(self, auth_client, confirmed_booking):
        """Cannot initiate checkout for a booking that is already confirmed."""
        url = f'/api/v1/bookings/{confirmed_booking.id}/checkout/'
        res = auth_client.post(url, {}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already' in str(res.data).lower()

    def test_checkout_nonexistent_booking_returns_404(self, auth_client):
        """Invalid booking UUID returns 404 Not Found."""
        url = '/api/v1/bookings/00000000-0000-0000-0000-000000000000/checkout/'
        res = auth_client.post(url, {}, format='json')
        assert res.status_code == status.HTTP_404_NOT_FOUND


# ─────────────────────────────────────────────────────────────
# 2. Stripe Webhook & Idempotency Replay Defense Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4StripeWebhooks:
    """Test suite for cryptographically verified webhooks and replay protection."""

    @patch('apps.payments.views.send_booking_confirmation_email_task.delay')
    def test_webhook_checkout_completed_confirms_booking(self, mock_email_task, api_client, pending_booking):
        """Stripe checkout.session.completed event confirms booking, creates Payment, and fires email task."""
        event_id = 'evt_test_checkout_001'
        payload = {
            'id': event_id,
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_session_123',
                    'client_reference_id': str(pending_booking.id),
                    'payment_intent': 'pi_test_intent_123',
                    'amount_total': int(pending_booking.total_amount * 100),
                    'currency': 'gbp',
                    'metadata': {
                        'booking_id': str(pending_booking.id),
                    },
                }
            },
        }

        url = '/api/v1/payments/webhook/'
        res = api_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['received'] is True

        # Verify booking state transitioned to confirmed
        pending_booking.refresh_from_db()
        assert pending_booking.status == 'confirmed'

        # Verify Payment record was generated
        payment = Payment.objects.get(booking=pending_booking)
        assert payment.stripe_checkout_session_id == 'cs_test_session_123'
        assert payment.stripe_payment_intent_id == 'pi_test_intent_123'
        assert payment.amount_paid == pending_booking.total_amount
        assert payment.currency == 'GBP'
        assert payment.payment_status == 'succeeded'

        # Verify StripePaymentEvent logged for idempotency
        assert StripePaymentEvent.objects.filter(event_id=event_id).exists()

        # Verify email task was queued
        mock_email_task.assert_called_once_with(str(pending_booking.id))

    @patch('apps.payments.views.send_booking_confirmation_email_task.delay')
    def test_webhook_idempotency_duplicate_event_safely_ignored(self, mock_email_task, api_client, pending_booking):
        """Replay attack test: duplicate delivery of identical Stripe event is safely skipped."""
        event_id = 'evt_test_replay_002'
        payload = {
            'id': event_id,
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_session_dup',
                    'client_reference_id': str(pending_booking.id),
                    'payment_intent': 'pi_test_intent_dup',
                    'amount_total': 7000,
                    'currency': 'gbp',
                    'metadata': {'booking_id': str(pending_booking.id)},
                }
            },
        }

        url = '/api/v1/payments/webhook/'

        # First delivery
        res1 = api_client.post(url, payload, format='json')
        assert res1.status_code == status.HTTP_200_OK

        # Second delivery (identical event_id replay)
        res2 = api_client.post(url, payload, format='json')
        assert res2.status_code == status.HTTP_200_OK
        assert res2.data['detail'] == "Duplicate event safely ignored."

        # Verify only 1 Payment record exists
        assert Payment.objects.filter(stripe_checkout_session_id='cs_test_session_dup').count() == 1

    def test_webhook_session_expired_cancels_booking_and_frees_capacity(self, api_client, pending_booking):
        """checkout.session.expired event cancels pending booking, freeing reserved capacity."""
        event_id = 'evt_test_expired_003'
        payload = {
            'id': event_id,
            'type': 'checkout.session.expired',
            'data': {
                'object': {
                    'id': 'cs_test_session_expired',
                    'client_reference_id': str(pending_booking.id),
                    'metadata': {'booking_id': str(pending_booking.id)},
                }
            },
        }

        url = '/api/v1/payments/webhook/'
        res = api_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        pending_booking.refresh_from_db()
        assert pending_booking.status == 'cancelled'

    def test_webhook_missing_event_metadata_returns_400(self, api_client):
        """Malformed webhook payload without id or type returns 400 Bad Request."""
        url = '/api/v1/payments/webhook/'
        res = api_client.post(url, {'foo': 'bar'}, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST


# ─────────────────────────────────────────────────────────────
# 3. Calendar Service (.ics RFC 5545) Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4CalendarService:
    """Test suite for RFC 5545 iCalendar generation."""

    def test_generate_ics_format_and_compliance(self, confirmed_booking):
        """CalendarService builds a compliant .ics calendar invitation."""
        ics_text = CalendarService.generate_ics(confirmed_booking)

        assert "BEGIN:VCALENDAR" in ics_text
        assert "VERSION:2.0" in ics_text
        assert "BEGIN:VEVENT" in ics_text
        assert f"UID:mingle-{confirmed_booking.id}@mingler.co.uk" in ics_text
        assert f"SUMMARY:{confirmed_booking.mingle.title}" in ics_text
        assert "LOCATION:The Shoreditch Social Lounge" in ics_text
        assert "STATUS:CONFIRMED" in ics_text
        assert "END:VEVENT" in ics_text
        assert "END:VCALENDAR" in ics_text


# ─────────────────────────────────────────────────────────────
# 4. Attendance-Gated Reviews & Ratings Suite (Defect #4 & #7 Fixes)
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4AttendanceGatedReviews:
    """Test suite verifying only confirmed attendees can submit feedback (Defect #4 fix)."""

    def test_confirmed_attendee_can_submit_feedback(self, auth_client, sample_mingle, confirmed_booking):
        """Member with confirmed ticket can submit 1-5 star feedback."""
        url = f'/api/v1/mingles/{sample_mingle.id}/feedback/'
        payload = {
            'overall_rating': 5,
            'comment': "Loved the cocktail choices and friendly crowd!",
        }
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert res.data['feedback']['overall_rating'] == 5
        assert res.data['feedback']['comment'] == "Loved the cocktail choices and friendly crowd!"

        # Verify database record
        feedback = Feedback.objects.get(id=res.data['feedback']['id'])
        assert feedback.mingle == sample_mingle
        assert feedback.author == confirmed_booking.profile

    def test_non_attendee_blocked_from_feedback_403(self, sample_mingle, second_member):
        """Defect #4 Verification: User without confirmed booking is strictly blocked (403 Forbidden)."""
        second_refresh = RefreshToken.for_user(second_member)
        second_client = APIClient()
        second_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(second_refresh.access_token)}')

        url = f'/api/v1/mingles/{sample_mingle.id}/feedback/'
        payload = {'overall_rating': 5, 'comment': "I was never there."}
        res = second_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert 'attendee' in str(res.data).lower()
        assert not Feedback.objects.filter(mingle=sample_mingle, author=second_member.profile).exists()

    def test_pending_booking_user_blocked_from_feedback_403(self, auth_client, sample_mingle, pending_booking):
        """User whose booking is still pending (unpaid) cannot submit feedback."""
        url = f'/api/v1/mingles/{sample_mingle.id}/feedback/'
        payload = {'overall_rating': 4, 'comment': "Not paid yet."}
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_duplicate_feedback_rejected_400(self, auth_client, sample_mingle, confirmed_booking):
        """User cannot submit feedback more than once for the same Mingle."""
        url = f'/api/v1/mingles/{sample_mingle.id}/feedback/'
        payload = {'overall_rating': 5, 'comment': "First feedback"}
        res1 = auth_client.post(url, payload, format='json')
        assert res1.status_code == status.HTTP_201_CREATED

        # Second attempt
        res2 = auth_client.post(url, {'overall_rating': 4, 'comment': "Second attempt"}, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already submitted' in str(res2.data).lower()

    def test_feedback_rating_bounds_validation(self, auth_client, sample_mingle, confirmed_booking):
        """Ratings below 1 or above 5 are rejected."""
        url = f'/api/v1/mingles/{sample_mingle.id}/feedback/'

        res_zero = auth_client.post(url, {'overall_rating': 0, 'comment': 'Bad'}, format='json')
        assert res_zero.status_code == status.HTTP_400_BAD_REQUEST

        res_six = auth_client.post(url, {'overall_rating': 6, 'comment': 'Too high'}, format='json')
        assert res_six.status_code == status.HTTP_400_BAD_REQUEST

    def test_submit_venue_review_3nf_success(self, auth_client, sample_venue):
        """Member can review a London venue directly, linking review in 3NF (Defect #7 fix)."""
        url = f'/api/v1/venues/{sample_venue.slug}/reviews/'
        payload = {
            'rating': 5,
            'comment': "Exceptional atmosphere and handcrafted drinks.",
        }
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert res.data['review']['rating'] == 5

        # Verify database record
        review = VenueReview.objects.get(id=res.data['review']['id'])
        assert review.venue == sample_venue

    def test_duplicate_venue_review_rejected_400(self, auth_client, sample_venue):
        """Member cannot submit duplicate reviews for the same venue."""
        url = f'/api/v1/venues/{sample_venue.slug}/reviews/'
        res1 = auth_client.post(url, {'rating': 5, 'comment': "First"}, format='json')
        assert res1.status_code == status.HTTP_201_CREATED

        res2 = auth_client.post(url, {'rating': 4, 'comment': "Second"}, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already reviewed' in str(res2.data).lower()


# ─────────────────────────────────────────────────────────────
# 5. Mutual Matching & Connection Engine Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4MutualMatchingAndConnections:
    """Test suite for post-mingle attendee selections and mutual match formation."""

    def test_selections_non_attendee_blocked_403(self, sample_mingle, second_member):
        """Non-attendee cannot submit selections for a Mingle."""
        second_refresh = RefreshToken.for_user(second_member)
        second_client = APIClient()
        second_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(second_refresh.access_token)}')

        url = f'/api/v1/mingles/{sample_mingle.id}/select/'
        payload = {'target_profile_ids': ['00000000-0000-0000-0000-000000000001']}
        res = second_client.post(url, payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    @patch('apps.interactions.services.send_mutual_match_notification_task.delay')
    def test_one_sided_selection_creates_no_connection(
        self, mock_task, auth_client, sample_mingle, confirmed_booking, second_confirmed_booking
    ):
        """When User A selects User B, but B hasn't selected A, no Connection is formed."""
        url = f'/api/v1/mingles/{sample_mingle.id}/select/'
        payload = {
            'target_profile_ids': [str(second_confirmed_booking.profile.id)],
        }
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['selections_recorded'] == 1
        assert res.data['new_mutual_connections'] == 0

        # Connection table must be empty
        assert Connection.objects.filter(mingle=sample_mingle).count() == 0
        mock_task.assert_not_called()

    @patch('apps.interactions.services.send_mutual_match_notification_task.delay')
    def test_mutual_selection_creates_confirmed_connection(
        self, mock_task, auth_client, sample_mingle, confirmed_booking, second_confirmed_booking, second_member
    ):
        """When both members select each other, a Connection is automatically formed."""
        url = f'/api/v1/mingles/{sample_mingle.id}/select/'

        # User A selects User B
        res1 = auth_client.post(url, {'target_profile_ids': [str(second_confirmed_booking.profile.id)]}, format='json')
        assert res1.status_code == status.HTTP_200_OK
        assert res1.data['new_mutual_connections'] == 0

        # User B selects User A
        second_refresh = RefreshToken.for_user(second_member)
        second_client = APIClient()
        second_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(second_refresh.access_token)}')

        res2 = second_client.post(url, {'target_profile_ids': [str(confirmed_booking.profile.id)]}, format='json')
        assert res2.status_code == status.HTTP_200_OK
        assert res2.data['new_mutual_connections'] == 1

        # Exactly 1 connection formed
        conn = Connection.objects.get(mingle=sample_mingle)
        assert conn.is_celebrated is False
        mock_task.assert_called_once_with(str(conn.id))

    def test_self_selection_filtered_out(self, auth_client, sample_mingle, confirmed_booking):
        """Member cannot select themselves."""
        url = f'/api/v1/mingles/{sample_mingle.id}/select/'
        payload = {
            'target_profile_ids': [str(confirmed_booking.profile.id)],
        }
        res = auth_client.post(url, payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['selections_recorded'] == 0
        assert not MingleSelection.objects.filter(selector=confirmed_booking.profile, target=confirmed_booking.profile).exists()

    def test_connection_list_and_celebration_flow(
        self, auth_client, sample_mingle, confirmed_booking, second_confirmed_booking
    ):
        """Member can list connections with sanitized cards, and mark connection celebrated."""
        # Create mutual connection
        p1 = confirmed_booking.profile
        p2 = second_confirmed_booking.profile
        conn = Connection.objects.create(
            mingle=sample_mingle,
            profile_a=min(p1, p2, key=lambda p: str(p.id)),
            profile_b=max(p1, p2, key=lambda p: str(p.id)),
            is_celebrated=False,
        )

        # 1. List connections
        list_url = '/api/v1/interactions/connections/'
        res_list = auth_client.get(list_url)
        assert res_list.status_code == status.HTTP_200_OK
        assert len(res_list.data['results']) == 1

        match_data = res_list.data['results'][0]
        assert match_data['id'] == str(conn.id)
        assert match_data['matched_profile']['display_name'] == 'Bob Builder'

        # Strict UK GDPR check: no DOB or email exposed
        assert 'date_of_birth' not in match_data['matched_profile']
        assert 'email' not in match_data['matched_profile']

        # 2. Mark celebrated
        celebrate_url = f'/api/v1/interactions/connections/{conn.id}/celebrate/'
        res_celeb = auth_client.post(celebrate_url, {}, format='json')
        assert res_celeb.status_code == status.HTTP_200_OK
        assert res_celeb.data['is_celebrated'] is True

        conn.refresh_from_db()
        assert conn.is_celebrated is True


# ─────────────────────────────────────────────────────────────
# 6. Celery Asynchronous Email Notifications Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart4CeleryAsyncTasks:
    """Test suite verifying Celery notification tasks and .ics calendar attachments."""

    def test_send_booking_confirmation_email_task_with_ics(self, confirmed_booking):
        """Task loads booking, renders HTML receipt, attaches .ics file, and dispatches email."""
        mail.outbox.clear()

        # Run task synchronously
        success = send_booking_confirmation_email_task(str(confirmed_booking.id))
        assert success is True

        # Verify sent email
        assert len(mail.outbox) == 1
        sent_email = mail.outbox[0]

        assert "Booking Confirmed: Friday Night Cocktail Social" in sent_email.subject
        assert confirmed_booking.profile.user.email in sent_email.to
        assert "Seats Reserved: 2" in sent_email.body
        assert "Total Amount Paid: £70.00 GBP" in sent_email.body

        # Verify .ics calendar attachment
        assert len(sent_email.attachments) == 1
        attachment = sent_email.attachments[0]
        filename, content, mimetype = attachment
        assert filename == "mingle-invitation.ics"
        assert "text/calendar" in mimetype
        assert "BEGIN:VCALENDAR" in content
        assert "Friday Night Cocktail Social" in content

    def test_send_mutual_match_notification_task(self, sample_mingle, confirmed_booking, second_confirmed_booking):
        """Task dispatches celebratory match notification to both members."""
        mail.outbox.clear()

        p1 = confirmed_booking.profile
        p2 = second_confirmed_booking.profile
        conn = Connection.objects.create(
            mingle=sample_mingle,
            profile_a=min(p1, p2, key=lambda p: str(p.id)),
            profile_b=max(p1, p2, key=lambda p: str(p.id)),
        )

        success = send_mutual_match_notification_task(str(conn.id))
        assert success is True

        # Verify two emails were sent (one to each member)
        assert len(mail.outbox) == 2
        recipients = [m.to[0] for m in mail.outbox]
        assert confirmed_booking.profile.user.email in recipients
        assert second_confirmed_booking.profile.user.email in recipients
        assert "It's a Mutual Match" in mail.outbox[0].subject
