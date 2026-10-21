"""Automated Test Suite for Part 3: Catalog, Dynamic Roster & Concurrency Booking.

Covers:
- Venue directory & opening hours inspection.
- Mingle catalog browsing and multi-parameter filtering.
- Dynamic 'Who's Going' attendee roster (Base44 Defect #5 fix).
- Strict UK GDPR privacy assertion (zero date_of_birth or email exposure).
- Past-Event Date Guard (Base44 Defect #3 fix).
- Atomic reservation creation, duplicate booking guard, and seat validation.
- Concurrency simulation verifying select_for_update() row-locking prevents overbooking.
- Booking cancellation and capacity release.
"""
from datetime import date, time, timedelta
import threading
from django.db import connection, transaction
from django.db.models import Sum
from django.utils import timezone
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.bookings.models import Booking
from apps.bookings.services import BookingService
from apps.interactions.models import VenueReview
from apps.mingles.models import Mingle
from apps.users.models import User
from apps.venues.models import Venue, VenueOpeningHour


@pytest.fixture
def sample_venue(db):
    """Approved venue in Shoreditch with opening hours and reviews."""
    venue = Venue.objects.create(
        name='The Shoreditch Sky Lounge',
        slug='the-shoreditch-sky-lounge',
        category='Rooftop Bar',
        area='Shoreditch',
        address='100 Shoreditch High St',
        postcode='E1 6JQ',
        description='Panoramic rooftop overlooking East London skyline.',
        status='approved',
        commission_rate=12.50,
    )
    # Add opening hours (Monday - Friday)
    for day in range(5):
        VenueOpeningHour.objects.create(
            venue=venue,
            day_of_week=day,
            open_time=time(16, 0),
            close_time=time(23, 30),
            is_closed=False,
        )
    return venue


@pytest.fixture
def sample_mingle(db, sample_venue):
    """Upcoming published Mingle event."""
    future_date = timezone.now().date() + timedelta(days=7)
    return Mingle.objects.create(
        venue=sample_venue,
        title='Sunset Cocktails & Chill',
        description='A relaxing evening of artisan cocktails with like-minded Londoners.',
        experience_type='cocktails',
        event_date=future_date,
        start_time=time(19, 0),
        duration_minutes=150,
        ticket_price=35.00,
        capacity=10,
        age_min=21,
        age_max=45,
        status='published',
        curator_notes='VIP table booked by the terrace.',
    )


@pytest.mark.django_db
class TestPart3Venues:
    """Test suite for the Venue discovery directory."""

    def test_venue_list_only_approved(self, api_client, sample_venue):
        """Only approved venues appear in directory; pending/rejected are excluded."""
        Venue.objects.create(name='Pending Bar', category='Pub', area='Soho', status='pending')
        Venue.objects.create(name='Rejected Club', category='Club', area='Brixton', status='rejected')

        res = api_client.get('/api/v1/venues/')
        assert res.status_code == status.HTTP_200_OK
        names = [v['name'] for v in res.data['results']]
        assert 'The Shoreditch Sky Lounge' in names
        assert 'Pending Bar' not in names
        assert 'Rejected Club' not in names

    def test_venue_filter_by_area_and_category(self, api_client, sample_venue):
        """Filter venues by borough/area and category."""
        Venue.objects.create(
            name='Mayfair Wine Vault',
            category='Wine Bar',
            area='Mayfair',
            status='approved',
        )

        # Filter by Shoreditch
        res_shoreditch = api_client.get('/api/v1/venues/?area=Shoreditch')
        assert res_shoreditch.status_code == status.HTTP_200_OK
        assert len(res_shoreditch.data['results']) == 1
        assert res_shoreditch.data['results'][0]['name'] == 'The Shoreditch Sky Lounge'

        # Filter by Wine Bar
        res_wine = api_client.get('/api/v1/venues/?category=Wine%20Bar')
        assert res_wine.status_code == status.HTTP_200_OK
        assert len(res_wine.data['results']) == 1
        assert res_wine.data['results'][0]['name'] == 'Mayfair Wine Vault'

    def test_venue_detail_by_slug_and_uuid(self, api_client, sample_venue):
        """Retrieve full venue details by slug and by UUID, including opening hours."""
        # By slug
        res_slug = api_client.get(f'/api/v1/venues/{sample_venue.slug}/')
        assert res_slug.status_code == status.HTTP_200_OK
        assert res_slug.data['name'] == sample_venue.name
        assert len(res_slug.data['opening_hours']) == 5
        assert res_slug.data['average_rating'] == 5.0

        # By UUID
        res_uuid = api_client.get(f'/api/v1/venues/{sample_venue.id}/')
        assert res_uuid.status_code == status.HTTP_200_OK
        assert res_uuid.data['name'] == sample_venue.name


@pytest.mark.django_db
class TestPart3MinglesCatalog:
    """Test suite for the Mingles Catalog and dynamic capacity."""

    def test_mingle_list_only_published_and_upcoming(self, api_client, sample_venue, sample_mingle):
        """Default catalog only shows upcoming published events."""
        past_date = timezone.now().date() - timedelta(days=2)
        future_date = timezone.now().date() + timedelta(days=5)

        Mingle.objects.create(
            venue=sample_venue,
            title='Past Event',
            experience_type='dinner',
            event_date=past_date,
            start_time=time(19, 0),
            ticket_price=40.00,
            capacity=8,
            status='published',
        )
        Mingle.objects.create(
            venue=sample_venue,
            title='Draft Experience',
            experience_type='brunch',
            event_date=future_date,
            start_time=time(11, 0),
            ticket_price=25.00,
            capacity=12,
            status='draft',
        )

        res = api_client.get('/api/v1/mingles/')
        assert res.status_code == status.HTTP_200_OK
        titles = [m['title'] for m in res.data['results']]
        assert 'Sunset Cocktails & Chill' in titles
        assert 'Past Event' not in titles
        assert 'Draft Experience' not in titles

    def test_mingle_filter_by_experience_and_price(self, api_client, sample_venue, sample_mingle):
        """Filter catalog by experience_type and maximum ticket price."""
        future_date = timezone.now().date() + timedelta(days=4)
        Mingle.objects.create(
            venue=sample_venue,
            title='Budget Beer Night',
            experience_type='other',
            event_date=future_date,
            start_time=time(18, 0),
            ticket_price=15.00,
            capacity=20,
            status='published',
        )

        res = api_client.get('/api/v1/mingles/?experience_type=cocktails&price_max=40.00')
        assert res.status_code == status.HTTP_200_OK
        titles = [m['title'] for m in res.data['results']]
        assert 'Sunset Cocktails & Chill' in titles
        assert 'Budget Beer Night' not in titles

    def test_mingle_spots_remaining_and_sold_out_calculation(self, api_client, sample_mingle, member_user):
        """Spots remaining dynamically accounts for confirmed bookings."""
        # Initial: capacity = 10, spots_remaining = 10, is_sold_out = False
        res = api_client.get(f'/api/v1/mingles/{sample_mingle.id}/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['spots_remaining'] == 10
        assert res.data['is_sold_out'] is False

        # Confirm bookings for 6 places total (using 4 + 2 places across two members to respect <= 5 constraint)
        extra_user = User.objects.create_user(email='extra_spots@example.com', password='Password123!')
        Booking.objects.create(
            mingle=sample_mingle,
            profile=member_user.profile,
            places_booked=4,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 4,
            status='confirmed',
        )
        Booking.objects.create(
            mingle=sample_mingle,
            profile=extra_user.profile,
            places_booked=2,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 2,
            status='confirmed',
        )

        # Remaining: 10 - 6 = 4 spots
        res2 = api_client.get(f'/api/v1/mingles/{sample_mingle.id}/')
        assert res2.data['spots_remaining'] == 4
        assert res2.data['is_sold_out'] is False

    def test_curator_notes_hidden_from_public(self, api_client, auth_client, admin_user, sample_mingle):
        """Curator notes are stripped from public responses and visible only to admins/staff."""
        # Public / non-staff user
        res_public = auth_client.get(f'/api/v1/mingles/{sample_mingle.id}/')
        assert res_public.status_code == status.HTTP_200_OK
        assert res_public.data['curator_notes'] == ''

        # Admin user
        admin_refresh = RefreshToken.for_user(admin_user)
        admin_client = APIClient()
        admin_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(admin_refresh.access_token)}')
        res_admin = admin_client.get(f'/api/v1/mingles/{sample_mingle.id}/')
        assert res_admin.status_code == status.HTTP_200_OK
        assert res_admin.data['curator_notes'] == 'VIP table booked by the terrace.'


@pytest.mark.django_db
class TestPart3DynamicRosterAndGDPR:
    """Test suite for the dynamic 'Who's Going' attendee roster (Base44 Defect #5 fix)."""

    def test_dynamic_attendees_list_and_gdpr_sanitization(
        self, api_client, sample_mingle, member_user, second_member
    ):
        """Attendees list reflects real confirmed bookings with zero PII exposure (UK GDPR)."""
        # Set private data on profiles
        member_user.profile.date_of_birth = date(1995, 6, 15)
        member_user.profile.save()
        second_member.profile.date_of_birth = date(1992, 10, 20)
        second_member.profile.save()

        # Create confirmed bookings
        Booking.objects.create(
            mingle=sample_mingle,
            profile=member_user.profile,
            places_booked=2,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 2,
            status='confirmed',
        )
        Booking.objects.create(
            mingle=sample_mingle,
            profile=second_member.profile,
            places_booked=1,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price,
            status='confirmed',
        )

        # Create a pending booking for another user (should NOT appear in attendee list)
        unconfirmed_user = User.objects.create_user(email='ghost@example.com', password='Password123!')
        Booking.objects.create(
            mingle=sample_mingle,
            profile=unconfirmed_user.profile,
            places_booked=1,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price,
            status='pending',
        )

        url = f'/api/v1/mingles/{sample_mingle.id}/attendees/'
        res = api_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert res.data['attendees_count'] == 2

        attendee_names = [a['display_name'] for a in res.data['attendees']]
        assert 'Alice Wonderland' in attendee_names
        assert 'Bob Builder' in attendee_names
        assert unconfirmed_user.profile.display_name not in attendee_names

        # Strict UK GDPR Assertion: date_of_birth and email must NEVER be present
        for attendee in res.data['attendees']:
            assert 'date_of_birth' not in attendee
            assert 'email' not in attendee


@pytest.mark.django_db
class TestPart3BookingEngine:
    """Test suite for the concurrency-safe booking engine and Date Guard."""

    def test_create_booking_success(self, auth_client, sample_mingle, member_user):
        """Member successfully reserves 2 places for an upcoming Mingle."""
        url = '/api/v1/bookings/'
        payload = {
            'mingle_id': str(sample_mingle.id),
            'places_booked': 2,
        }
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['success'] is True
        assert 'booking' in res.data

        booking_data = res.data['booking']
        assert booking_data['places_booked'] == 2
        assert float(booking_data['unit_price']) == 35.00
        assert float(booking_data['total_amount']) == 70.00
        assert booking_data['status'] == 'pending'

        # Verify database record
        booking = Booking.objects.get(id=booking_data['id'])
        assert booking.profile == member_user.profile
        assert booking.mingle == sample_mingle
        assert booking.places_booked == 2

    def test_create_booking_unauthenticated_blocked(self, api_client, sample_mingle):
        """Unauthenticated guest cannot create a reservation."""
        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(sample_mingle.id), 'places_booked': 1}
        res = api_client.post(url, payload, format='json')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_past_event_date_guard_blocks_booking(self, auth_client, sample_venue):
        """Date guard strictly rejects booking attempts for past events (Fixes Base44 Defect #3)."""
        past_date = timezone.now().date() - timedelta(days=1)
        past_mingle = Mingle.objects.create(
            venue=sample_venue,
            title='Yesterday Dinner',
            experience_type='dinner',
            event_date=past_date,
            start_time=time(19, 0),
            ticket_price=50.00,
            capacity=10,
            status='published',
        )

        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(past_mingle.id), 'places_booked': 1}
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'past' in str(res.data).lower()
        assert not Booking.objects.filter(mingle=past_mingle).exists()

    def test_past_event_started_today_blocked(self, auth_client, sample_venue):
        """Date guard rejects booking when event is scheduled for today but start time has passed."""
        now = timezone.now()
        one_hour_ago = (now - timedelta(hours=1)).time()
        started_mingle = Mingle.objects.create(
            venue=sample_venue,
            title='Afternoon Tea',
            experience_type='brunch',
            event_date=now.date(),
            start_time=one_hour_ago,
            ticket_price=30.00,
            capacity=10,
            status='published',
        )

        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(started_mingle.id), 'places_booked': 1}
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already started' in str(res.data).lower()

    def test_unpublished_event_booking_blocked(self, auth_client, sample_venue):
        """Cannot book draft or cancelled Mingle events."""
        future_date = timezone.now().date() + timedelta(days=10)
        draft_mingle = Mingle.objects.create(
            venue=sample_venue,
            title='Unapproved Event',
            experience_type='dinner',
            event_date=future_date,
            start_time=time(20, 0),
            ticket_price=45.00,
            capacity=10,
            status='draft',
        )

        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(draft_mingle.id), 'places_booked': 1}
        res = auth_client.post(url, payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_capacity_overflow_rejected(self, auth_client, sample_mingle, second_member):
        """Attempting to book more seats than available capacity is rejected."""
        # Reserve 9 out of 10 seats (5 + 4 places to respect <= 5 constraint)
        extra_user = User.objects.create_user(email='extra_cap@example.com', password='Password123!')
        Booking.objects.create(
            mingle=sample_mingle,
            profile=second_member.profile,
            places_booked=5,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 5,
            status='confirmed',
        )
        Booking.objects.create(
            mingle=sample_mingle,
            profile=extra_user.profile,
            places_booked=4,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 4,
            status='confirmed',
        )

        # Attempt to book 2 seats when only 1 is left
        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(sample_mingle.id), 'places_booked': 2}
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'only 1 seat(s) remain' in str(res.data).lower()

    def test_sold_out_rejection(self, auth_client, sample_mingle, second_member):
        """Attempting to book a completely full event is rejected."""
        # Reserve 10 seats (5 + 5 places to respect <= 5 constraint)
        extra_user = User.objects.create_user(email='extra_soldout@example.com', password='Password123!')
        Booking.objects.create(
            mingle=sample_mingle,
            profile=second_member.profile,
            places_booked=5,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 5,
            status='confirmed',
        )
        Booking.objects.create(
            mingle=sample_mingle,
            profile=extra_user.profile,
            places_booked=5,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 5,
            status='confirmed',
        )

        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(sample_mingle.id), 'places_booked': 1}
        res = auth_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'sold out' in str(res.data).lower()

    def test_places_booked_range_validation(self, auth_client, sample_mingle):
        """Validates that places_booked must be between 1 and 5."""
        url = '/api/v1/bookings/'

        # 0 places
        res_zero = auth_client.post(url, {'mingle_id': str(sample_mingle.id), 'places_booked': 0}, format='json')
        assert res_zero.status_code == status.HTTP_400_BAD_REQUEST

        # 6 places
        res_six = auth_client.post(url, {'mingle_id': str(sample_mingle.id), 'places_booked': 6}, format='json')
        assert res_six.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_active_booking_rejected(self, auth_client, sample_mingle, member_user):
        """User cannot create a second active booking for the same event."""
        url = '/api/v1/bookings/'
        payload = {'mingle_id': str(sample_mingle.id), 'places_booked': 1}

        res1 = auth_client.post(url, payload, format='json')
        assert res1.status_code == status.HTTP_201_CREATED

        # Duplicate attempt
        res2 = auth_client.post(url, payload, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already have a' in str(res2.data).lower()

    def test_my_bookings_list_and_detail(self, auth_client, sample_mingle, member_user):
        """Member can inspect their booking history and retrieve a single booking."""
        booking = Booking.objects.create(
            mingle=sample_mingle,
            profile=member_user.profile,
            places_booked=2,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 2,
            status='confirmed',
        )

        # List
        res_list = auth_client.get('/api/v1/bookings/my-bookings/')
        assert res_list.status_code == status.HTTP_200_OK
        assert res_list.data['count'] == 1
        assert res_list.data['results'][0]['id'] == str(booking.id)

        # Detail
        res_detail = auth_client.get(f'/api/v1/bookings/{booking.id}/')
        assert res_detail.status_code == status.HTTP_200_OK
        assert res_detail.data['id'] == str(booking.id)
        assert res_detail.data['places_booked'] == 2

    def test_cancel_booking_releases_capacity(self, auth_client, sample_mingle, member_user):
        """Cancelling a booking changes status and immediately releases reserved capacity."""
        booking = Booking.objects.create(
            mingle=sample_mingle,
            profile=member_user.profile,
            places_booked=3,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price * 3,
            status='confirmed',
        )

        assert BookingService.calculate_spots_remaining(sample_mingle) == 7

        cancel_url = f'/api/v1/bookings/{booking.id}/cancel/'
        res = auth_client.post(cancel_url, {'reason': 'Cannot make it'}, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['success'] is True
        assert res.data['booking']['status'] == 'cancelled'

        booking.refresh_from_db()
        assert booking.status == 'cancelled'
        assert BookingService.calculate_spots_remaining(sample_mingle) == 10

    def test_cancel_booking_unauthorized_user_blocked(self, api_client, sample_mingle, member_user, second_member):
        """User cannot cancel another member's booking."""
        booking = Booking.objects.create(
            mingle=sample_mingle,
            profile=member_user.profile,
            places_booked=1,
            unit_price=sample_mingle.ticket_price,
            total_amount=sample_mingle.ticket_price,
            status='pending',
        )

        # Authenticate as second member
        second_refresh = RefreshToken.for_user(second_member)
        second_client = APIClient()
        second_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(second_refresh.access_token)}')

        cancel_url = f'/api/v1/bookings/{booking.id}/cancel/'
        res = second_client.post(cancel_url, {}, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN
        booking.refresh_from_db()
        assert booking.status == 'pending'

    @pytest.mark.django_db(transaction=True)
    def test_concurrency_race_condition_overbooking_prevention(self, sample_venue):
        """Simulates simultaneous booking attempts on last available seats.

        Verifies that select_for_update() row-level locking ensures capacity is never exceeded.
        """
        future_date = timezone.now().date() + timedelta(days=3)
        mingle = Mingle.objects.create(
            venue=sample_venue,
            title='Exclusive Micro-Tasting',
            experience_type='wine_tasting',
            event_date=future_date,
            start_time=time(19, 0),
            ticket_price=50.00,
            capacity=2,  # Only 2 seats total
            status='published',
        )

        user_a = User.objects.create_user(email='concurrent_a@example.com', password='Password123!')
        user_b = User.objects.create_user(email='concurrent_b@example.com', password='Password123!')

        results = []
        errors = []

        def attempt_booking(user, places):
            # Close connection so thread gets its own db connection
            connection.close()
            try:
                booking = BookingService.create_booking(
                    profile=user.profile,
                    mingle_id=str(mingle.id),
                    places_booked=places,
                )
                results.append(booking.id)
            except Exception as e:
                errors.append(str(e))
            finally:
                connection.close()

        # Both threads attempt to reserve 2 places simultaneously (capacity is only 2)
        thread_a = threading.Thread(target=attempt_booking, args=(user_a, 2))
        thread_b = threading.Thread(target=attempt_booking, args=(user_b, 2))

        thread_a.start()
        thread_b.start()
        thread_a.join()
        thread_b.join()

        # Exactly ONE booking must succeed, and the other must be rejected
        assert len(results) == 1
        assert len(errors) == 1
        assert 'not enough seats' in errors[0].lower() or 'remain' in errors[0].lower()

        # Total places booked in database must NEVER exceed capacity
        total_booked = (
            Booking.objects.filter(mingle=mingle, status__in=['pending', 'confirmed']).aggregate(
                total=Sum('places_booked')
            )['total']
            or 0
        )
        assert total_booked == 2
        assert total_booked <= mingle.capacity
