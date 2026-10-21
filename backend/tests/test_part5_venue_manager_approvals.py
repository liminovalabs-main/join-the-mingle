"""Automated Test Suite for Part 5: Venue Manager Portal & Founder Approvals Engine.

Covers:
- Self-service venue registration with email verification gate.
- Automatic VenueMember association & user role promotion to venue_manager.
- Venue operating hours configuration with day-of-week validation.
- Venue profile management & unauthorized modification blocking.
- Mingle proposal submission lifecycle and past-date guard.
- Founder queue & approval actions for venues (approve/reject).
- Founder queue & approval actions for Mingles (approve/publish, changes_requested, reject).
- Platform commission rate configuration and historical audit log.
"""
from datetime import time, timedelta
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.administration.models import PlatformSetting
from apps.mingles.models import Mingle
from apps.users.models import User
from apps.venues.models import Venue, VenueMember, VenueOpeningHour


@pytest.fixture
def unverified_member(db):
    """Member user whose email is not yet verified."""
    user = User.objects.create_user(
        email='unverified@example.com',
        password='Password123!',
        role='member',
        is_active=True,
        is_email_verified=False,
    )
    user.profile.display_name = 'Unverified User'
    user.profile.save()
    return user


@pytest.fixture
def unverified_client(unverified_member):
    """APIClient authenticated as unverified member."""
    client = APIClient()
    refresh = RefreshToken.for_user(unverified_member)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def venue_manager_user(db):
    """User with venue_manager role."""
    user = User.objects.create_user(
        email='manager@rooftop.co.uk',
        password='Password123!',
        role='venue_manager',
        is_active=True,
        is_email_verified=True,
    )
    user.profile.display_name = 'Marcus Manager'
    user.profile.save()
    return user


@pytest.fixture
def venue_manager_client(venue_manager_user):
    """APIClient authenticated as venue_manager_user."""
    client = APIClient()
    refresh = RefreshToken.for_user(venue_manager_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def admin_client(admin_user):
    """APIClient authenticated as platform administrator."""
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


@pytest.fixture
def sample_pending_venue(db, member_user):
    """A venue awaiting founder approval."""
    venue = Venue.objects.create(
        name='The Shoreditch Greenhouse',
        slug='the-shoreditch-greenhouse',
        category='Cocktail Lounge',
        area='Shoreditch',
        address='100 Shoreditch High St',
        postcode='E1 6JE',
        description='Botanical greenhouse bar.',
        status='pending',
    )
    VenueMember.objects.create(venue=venue, user=member_user, role='manager')
    return venue


@pytest.fixture
def sample_approved_venue(db, venue_manager_user):
    """An approved venue managed by venue_manager_user."""
    venue = Venue.objects.create(
        name='The Mayfair Speakeasy',
        slug='the-mayfair-speakeasy',
        category='Speakeasy',
        area='Mayfair',
        address='12 Berkeley Square',
        postcode='W1J 6BQ',
        description='Exclusive cocktail lounge.',
        status='approved',
    )
    VenueMember.objects.create(venue=venue, user=venue_manager_user, role='manager')
    return venue


@pytest.fixture
def sample_submitted_mingle(db, sample_approved_venue):
    """A Mingle experience proposal submitted by the venue."""
    future_date = timezone.now().date() + timedelta(days=14)
    return Mingle.objects.create(
        venue=sample_approved_venue,
        title='Mayfair Secret Cocktail Evening',
        description='An intimate evening of bespoke cocktails.',
        experience_type='cocktails',
        event_date=future_date,
        start_time=time(19, 0),
        duration_minutes=120,
        ticket_price=Decimal('45.00'),
        capacity=12,
        status='submitted',
    )


# ─────────────────────────────────────────────────────────────
# 1. Venue Self-Service Registration Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5VenueRegistration:
    """Test suite for member venue onboarding and email verification gate."""

    def test_venue_registration_success(self, auth_client, member_user):
        """Email-verified member registers a venue; creates pending venue and promotes user role."""
        payload = {
            'name': 'The Hackney Social Loft',
            'category': 'Event Space & Bar',
            'area': 'Hackney',
            'address': '45 Mare Street',
            'postcode': 'E8 4RP',
            'description': 'Creative warehouse social space in East London.',
        }
        res = auth_client.post('/api/v1/venues/register/', payload, format='json')

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['name'] == payload['name']
        assert res.data['status'] == 'pending'
        assert res.data['slug'] == 'the-hackney-social-loft'

        # Verify DB records
        venue = Venue.objects.get(name=payload['name'])
        assert venue.status == 'pending'

        # Verify VenueMember linkage
        membership = VenueMember.objects.filter(venue=venue, user=member_user).first()
        assert membership is not None
        assert membership.role == 'manager'

        # Verify user role promotion
        member_user.refresh_from_db()
        assert member_user.role == 'venue_manager'

    def test_venue_registration_unverified_email_blocked_403(self, unverified_client):
        """Unverified users cannot register a venue."""
        payload = {
            'name': 'The Unauthorized Pub',
            'category': 'Pub',
            'area': 'Soho',
            'address': '10 Greek St',
            'postcode': 'W1D 4DH',
            'description': 'A historic pub.',
        }
        res = unverified_client.post('/api/v1/venues/register/', payload, format='json')

        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert 'verification' in str(res.data).lower()
        assert not Venue.objects.filter(name=payload['name']).exists()

    def test_venue_registration_unauthenticated_blocked_401(self, api_client):
        """Unauthenticated requests are blocked."""
        payload = {'name': 'Anonymous Venue'}
        res = api_client.post('/api/v1/venues/register/', payload, format='json')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_venue_registration_duplicate_name_blocked_400(self, auth_client, sample_pending_venue):
        """Registering a venue with an identical/conflicting name is rejected."""
        payload = {
            'name': sample_pending_venue.name,
            'category': 'Lounge',
            'area': 'Shoreditch',
            'address': 'Different address',
            'postcode': 'E1 6JE',
            'description': 'Trying duplicate name',
        }
        res = auth_client.post('/api/v1/venues/register/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in str(res.data)

    def test_venue_registration_blank_name_blocked_400(self, auth_client):
        """Blank venue name is rejected."""
        payload = {
            'name': '   ',
            'category': 'Bar',
            'area': 'Camden',
            'address': 'Camden High St',
            'postcode': 'NW1 7JE',
            'description': 'Test description',
        }
        res = auth_client.post('/api/v1/venues/register/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST


# ─────────────────────────────────────────────────────────────
# 2. Managed Venues Retrieval & Operating Hours Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5VenueManagement:
    """Test suite for venue manager dashboard, profile edits, and operating hours."""

    def test_get_my_venues_list(self, venue_manager_client, sample_approved_venue, auth_client):
        """Venue manager retrieves their own venues; non-manager gets empty list."""
        # Venue manager request
        res = venue_manager_client.get('/api/v1/venues/mine/')
        assert res.status_code == status.HTTP_200_OK
        assert len(res.data['results']) == 1
        assert res.data['results'][0]['id'] == str(sample_approved_venue.id)
        assert res.data['results'][0]['role'] == 'manager'

        # Regular member request
        res_member = auth_client.get('/api/v1/venues/mine/')
        assert res_member.status_code == status.HTTP_200_OK
        assert len(res_member.data['results']) == 0

    def test_venue_manager_update_venue_profile(self, venue_manager_client, sample_approved_venue):
        """Venue manager can update profile details of their venue."""
        url = f'/api/v1/venues/{sample_approved_venue.id}/'
        payload = {
            'description': 'Updated speakeasy description with live jazz evenings.',
            'area': 'Mayfair Central',
        }
        res = venue_manager_client.patch(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        sample_approved_venue.refresh_from_db()
        assert sample_approved_venue.description == payload['description']
        assert sample_approved_venue.area == payload['area']

    def test_unassigned_user_cannot_update_venue_403(self, auth_client, sample_approved_venue):
        """A user who is not a manager of the venue cannot edit it."""
        url = f'/api/v1/venues/{sample_approved_venue.id}/'
        payload = {'description': 'Malicious attempt to alter description'}
        res = auth_client.patch(url, payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_venue_operating_hours_update_success(self, venue_manager_client, sample_approved_venue):
        """Manager can set 7-day operating hours."""
        url = f'/api/v1/venues/{sample_approved_venue.id}/hours/'
        payload = [
            {'day_of_week': 0, 'open_time': '17:00:00', 'close_time': '23:30:00', 'is_closed': False},
            {'day_of_week': 1, 'open_time': '17:00:00', 'close_time': '23:30:00', 'is_closed': False},
            {'day_of_week': 6, 'is_closed': True},
        ]
        res = venue_manager_client.put(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert len(res.data) == 3

        # Check DB
        monday = VenueOpeningHour.objects.get(venue=sample_approved_venue, day_of_week=0)
        assert monday.open_time == time(17, 0)
        assert monday.is_closed is False

        sunday = VenueOpeningHour.objects.get(venue=sample_approved_venue, day_of_week=6)
        assert sunday.is_closed is True
        assert sunday.open_time is None

    def test_venue_operating_hours_validation_missing_times(self, venue_manager_client, sample_approved_venue):
        """Missing open/close times for an open day returns 400 Bad Request."""
        url = f'/api/v1/venues/{sample_approved_venue.id}/hours/'
        payload = [
            {'day_of_week': 2, 'is_closed': False},  # missing open_time and close_time
        ]
        res = venue_manager_client.put(url, payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST


# ─────────────────────────────────────────────────────────────
# 3. Mingle Proposals & Submissions Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5MingleProposals:
    """Test suite for venue manager Mingle proposal submission and event listings."""

    def test_mingle_proposal_submission_success(self, venue_manager_client, sample_approved_venue):
        """Venue manager can submit a Mingle proposal for their approved venue."""
        future_date = (timezone.now().date() + timedelta(days=21)).isoformat()
        payload = {
            'venue_id': str(sample_approved_venue.id),
            'title': 'Saturday Speakeasy Social',
            'description': 'Exclusive cocktails and social games.',
            'experience_type': 'cocktails',
            'event_date': future_date,
            'start_time': '20:00:00',
            'duration_minutes': 120,
            'ticket_price': '38.00',
            'capacity': 10,
            'age_min': 21,
            'age_max': 40,
        }
        res = venue_manager_client.post('/api/v1/mingles/submit/', payload, format='json')

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['status'] == 'submitted'
        assert res.data['title'] == payload['title']

        # Verify DB
        mingle = Mingle.objects.get(id=res.data['id'])
        assert mingle.status == 'submitted'
        assert mingle.venue == sample_approved_venue
        assert mingle.capacity == 10

    def test_mingle_proposal_unapproved_venue_blocked_400(self, auth_client, sample_pending_venue):
        """Proposals cannot be submitted for unapproved/pending venues."""
        future_date = (timezone.now().date() + timedelta(days=20)).isoformat()
        payload = {
            'venue_id': str(sample_pending_venue.id),
            'title': 'Greenhouse Social',
            'experience_type': 'cocktails',
            'event_date': future_date,
            'start_time': '19:00:00',
            'ticket_price': '25.00',
            'capacity': 10,
        }
        res = auth_client.post('/api/v1/mingles/submit/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'approved' in str(res.data).lower()

    def test_mingle_proposal_unassigned_user_blocked_403(self, auth_client, sample_approved_venue):
        """A user who is not a member of the venue cannot submit proposals for it."""
        future_date = (timezone.now().date() + timedelta(days=25)).isoformat()
        payload = {
            'venue_id': str(sample_approved_venue.id),
            'title': 'Intruder Proposal',
            'experience_type': 'dinner',
            'event_date': future_date,
            'start_time': '19:00:00',
            'ticket_price': '30.00',
            'capacity': 8,
        }
        res = auth_client.post('/api/v1/mingles/submit/', payload, format='json')
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_mingle_proposal_past_date_guard_blocked_400(self, venue_manager_client, sample_approved_venue):
        """Submitting a proposal for a past date is rejected."""
        past_date = (timezone.now().date() - timedelta(days=2)).isoformat()
        payload = {
            'venue_id': str(sample_approved_venue.id),
            'title': 'Past Mingle Event',
            'experience_type': 'cocktails',
            'event_date': past_date,
            'start_time': '19:00:00',
            'ticket_price': '30.00',
            'capacity': 8,
        }
        res = venue_manager_client.post('/api/v1/mingles/submit/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'past' in str(res.data).lower()

    def test_mingle_proposal_invalid_age_bounds_blocked_400(self, venue_manager_client, sample_approved_venue):
        """age_min < 18 or age_max < age_min is rejected."""
        future_date = (timezone.now().date() + timedelta(days=10)).isoformat()
        payload = {
            'venue_id': str(sample_approved_venue.id),
            'title': 'Underage Mingle',
            'experience_type': 'cocktails',
            'event_date': future_date,
            'start_time': '19:00:00',
            'ticket_price': '30.00',
            'capacity': 8,
            'age_min': 16,  # Illegal under-18
            'age_max': 25,
        }
        res = venue_manager_client.post('/api/v1/mingles/submit/', payload, format='json')
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_venue_mingles_list(self, venue_manager_client, sample_approved_venue, sample_submitted_mingle):
        """Venue manager can list all mingles hosted at their venue."""
        url = f'/api/v1/venues/{sample_approved_venue.id}/mingles/'
        res = venue_manager_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        assert len(res.data['results']) == 1
        assert res.data['results'][0]['id'] == str(sample_submitted_mingle.id)
        assert res.data['results'][0]['status'] == 'submitted'


# ─────────────────────────────────────────────────────────────
# 4. Founder Approvals Queue: Venues Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5FounderVenueApprovals:
    """Test suite for founder review, approval, and rejection of venue applications."""

    def test_founder_list_pending_venues(self, admin_client, sample_pending_venue, auth_client):
        """Platform admins can view pending venues queue; regular members are blocked."""
        # Admin request
        res_admin = admin_client.get('/api/v1/admin/approvals/venues/')
        assert res_admin.status_code == status.HTTP_200_OK
        assert len(res_admin.data['results']) == 1
        assert res_admin.data['results'][0]['id'] == str(sample_pending_venue.id)
        assert res_admin.data['results'][0]['manager_email'] == 'alice@example.com'

        # Regular member request
        res_member = auth_client.get('/api/v1/admin/approvals/venues/')
        assert res_member.status_code == status.HTTP_403_FORBIDDEN

    def test_founder_approve_venue_success(self, admin_client, sample_pending_venue, api_client):
        """Approving a venue transitions status to 'approved' and makes it visible publicly."""
        url = f'/api/v1/admin/approvals/venues/{sample_pending_venue.id}/'
        payload = {'action': 'approve'}
        res = admin_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'approved'

        sample_pending_venue.refresh_from_db()
        assert sample_pending_venue.status == 'approved'

        # Verify venue is now visible in public directory
        public_res = api_client.get('/api/v1/venues/')
        venue_names = [v['name'] for v in public_res.data['results']]
        assert sample_pending_venue.name in venue_names

    def test_founder_reject_venue_success(self, admin_client, sample_pending_venue):
        """Rejecting a venue transitions status to 'rejected'."""
        url = f'/api/v1/admin/approvals/venues/{sample_pending_venue.id}/'
        payload = {'action': 'reject'}
        res = admin_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'rejected'

        sample_pending_venue.refresh_from_db()
        assert sample_pending_venue.status == 'rejected'


# ─────────────────────────────────────────────────────────────
# 5. Founder Approvals Queue: Mingles Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5FounderMingleApprovals:
    """Test suite for founder moderation of submitted Mingle proposals."""

    def test_founder_list_pending_mingles(self, admin_client, sample_submitted_mingle, auth_client):
        """Admin can list submitted proposals; regular members are blocked."""
        res_admin = admin_client.get('/api/v1/admin/approvals/mingles/')
        assert res_admin.status_code == status.HTTP_200_OK
        assert len(res_admin.data['results']) == 1
        assert res_admin.data['results'][0]['id'] == str(sample_submitted_mingle.id)

        res_member = auth_client.get('/api/v1/admin/approvals/mingles/')
        assert res_member.status_code == status.HTTP_403_FORBIDDEN

    def test_founder_approve_and_publish_mingle(self, admin_client, sample_submitted_mingle, api_client):
        """Approving a Mingle sets status='published', opening it to public browsing and bookings."""
        url = f'/api/v1/admin/approvals/mingles/{sample_submitted_mingle.id}/'
        payload = {
            'action': 'approve',
            'curator_notes': 'Looks wonderful. Approved for live reservations.',
        }
        res = admin_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'published'
        assert res.data['curator_notes'] == payload['curator_notes']

        sample_submitted_mingle.refresh_from_db()
        assert sample_submitted_mingle.status == 'published'

        # Verify it now appears in public Mingle catalogue
        public_res = api_client.get('/api/v1/mingles/')
        mingle_titles = [m['title'] for m in public_res.data['results']]
        assert sample_submitted_mingle.title in mingle_titles

    def test_founder_request_changes_on_mingle(
        self, admin_client, sample_submitted_mingle, venue_manager_client
    ):
        """Requesting changes sets status='changes_requested' and communicates curator notes."""
        url = f'/api/v1/admin/approvals/mingles/{sample_submitted_mingle.id}/'
        payload = {
            'action': 'changes_requested',
            'curator_notes': 'Please reduce capacity from 12 to 10 for a cozier atmosphere.',
        }
        res = admin_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'changes_requested'

        sample_submitted_mingle.refresh_from_db()
        assert sample_submitted_mingle.status == 'changes_requested'
        assert sample_submitted_mingle.curator_notes == payload['curator_notes']

        # Venue manager can see curator notes
        venue_mingles_url = f'/api/v1/venues/{sample_submitted_mingle.venue.id}/mingles/'
        res_vm = venue_manager_client.get(venue_mingles_url)
        assert res_vm.status_code == status.HTTP_200_OK
        assert res_vm.data['results'][0]['curator_notes'] == payload['curator_notes']

    def test_founder_reject_mingle(self, admin_client, sample_submitted_mingle):
        """Rejecting a Mingle proposal cancels it."""
        url = f'/api/v1/admin/approvals/mingles/{sample_submitted_mingle.id}/'
        payload = {'action': 'reject', 'curator_notes': 'Does not align with platform theme.'}
        res = admin_client.post(url, payload, format='json')

        assert res.status_code == status.HTTP_200_OK
        assert res.data['status'] == 'cancelled'

        sample_submitted_mingle.refresh_from_db()
        assert sample_submitted_mingle.status == 'cancelled'


# ─────────────────────────────────────────────────────────────
# 6. Platform Settings & Commission Rates Suite
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPart5PlatformSettings:
    """Test suite for platform-wide commission management and audit logs."""

    def test_founder_get_and_update_commission_rate(self, admin_client):
        """Admin views default commission (10%) and updates it to 12.50% with audit log."""
        # 1. GET default rate
        get_res = admin_client.get('/api/v1/admin/platform-settings/commission/')
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.data['commission_rate'] == 10.0

        # 2. PATCH new rate
        patch_payload = {
            'commission_rate': '12.50',
            'notes': 'Q4 seasonal adjustment for holiday mingles.',
        }
        patch_res = admin_client.patch('/api/v1/admin/platform-settings/commission/', patch_payload, format='json')
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data['success'] is True
        assert patch_res.data['setting']['value'] == 12.5
        assert patch_res.data['setting']['notes'] == patch_payload['notes']

        # 3. GET verified rate reflects new value and includes history
        get_res2 = admin_client.get('/api/v1/admin/platform-settings/commission/')
        assert get_res2.status_code == status.HTTP_200_OK
        assert get_res2.data['commission_rate'] == 12.5
        assert len(get_res2.data['history']) >= 1

    def test_non_admin_cannot_access_platform_settings_403(self, auth_client):
        """Regular users are blocked from viewing or changing commission settings."""
        get_res = auth_client.get('/api/v1/admin/platform-settings/commission/')
        assert get_res.status_code == status.HTTP_403_FORBIDDEN

        patch_res = auth_client.patch('/api/v1/admin/platform-settings/commission/', {'commission_rate': 15.0}, format='json')
        assert patch_res.status_code == status.HTTP_403_FORBIDDEN
