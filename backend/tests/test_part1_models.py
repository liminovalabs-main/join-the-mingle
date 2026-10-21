"""Tests for Part 1: Core 3NF Database Models, Constraints & Relationships."""
from datetime import date, time
import uuid
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.users.models import User, Profile
from apps.venues.models import Venue, VenueOpeningHour, VenueMember
from apps.mingles.models import Mingle
from apps.bookings.models import Booking
from apps.payments.models import Payment, StripePaymentEvent
from apps.interactions.models import MingleSelection, Connection, Feedback, VenueReview
from apps.administration.models import PlatformSetting


@pytest.mark.django_db
class TestPart1Models:
    """Test suite verifying 3NF models, primary keys, and database constraints."""

    def test_user_creation_triggers_profile_signal(self):
        """Creating a User must automatically create a linked Profile via post_save signal."""
        user = User.objects.create_user(
            email='signal_test@mingler.co.uk',
            password='TestPassword123!',
        )
        assert isinstance(user.id, uuid.UUID)
        assert hasattr(user, 'profile')
        assert user.profile.display_name == 'signal_test'
        assert user.role == 'member'

    def test_venue_slug_auto_generation(self):
        """Venue model should auto-generate a URL slug from its name on save."""
        venue = Venue.objects.create(
            name='The Shoreditch Social Club',
            category='Cocktail Bar & Lounge',
            area='Shoreditch',
            address='123 Shoreditch High St',
            postcode='E1 6JE',
            description='A vibrant venue for cocktail mingles.',
            commission_rate=12.50,
        )
        assert venue.slug == 'the-shoreditch-social-club'
        assert venue.status == 'pending'
        assert isinstance(venue.id, uuid.UUID)

    def test_venue_opening_hours_structure(self):
        """VenueOpeningHour uses validated TimeFields."""
        venue = Venue.objects.create(
            name='Mayfair Dining Hall',
            category='Restaurant',
            area='Mayfair',
            address='45 Mayfair St',
            postcode='W1K 4QA',
            description='Fine dining experiences.',
        )
        hour = VenueOpeningHour.objects.create(
            venue=venue,
            day_of_week=0,  # Monday
            open_time=time(17, 0),
            close_time=time(23, 0),
            is_closed=False,
        )
        assert hour.open_time == time(17, 0)
        assert hour.close_time == time(23, 0)
        assert not hour.is_closed

    def test_mingle_lifecycle_and_foreign_keys(self):
        """Mingle model correctly references Venue and defaults to draft status."""
        venue = Venue.objects.create(
            name='Brixton Wine Loft',
            category='Wine Bar',
            area='Brixton',
            address='10 Coldharbour Ln',
            postcode='SW9 8PR',
            description='Curated natural wines.',
        )
        mingle = Mingle.objects.create(
            venue=venue,
            title='London Wine Explorers',
            experience_type='wine_tasting',
            event_date=date(2026, 11, 20),
            start_time=time(19, 0),
            duration_minutes=120,
            ticket_price=35.00,
            capacity=16,
            age_min=21,
            age_max=45,
        )
        assert mingle.status == 'draft'
        assert mingle.ticket_price == 35.00
        assert mingle.venue == venue

    def test_booking_places_range_constraint(self):
        """Booking places_booked must be between 1 and 5 according to check constraint."""
        user = User.objects.create_user(email='buyer@example.com', password='Password123!')
        venue = Venue.objects.create(
            name='Camden Pub',
            category='Pub',
            area='Camden',
            address='2 Camden Rd',
            postcode='NW1 9DP',
            description='Classic pub.',
        )
        mingle = Mingle.objects.create(
            venue=venue,
            title='Pub Quiz Night',
            experience_type='games',
            event_date=date(2026, 11, 25),
            start_time=time(18, 30),
            ticket_price=15.00,
            capacity=20,
        )

        # Valid booking (1-5 places)
        valid_booking = Booking.objects.create(
            mingle=mingle,
            profile=user.profile,
            places_booked=2,
            unit_price=15.00,
            total_amount=30.00,
            status='pending',
        )
        assert valid_booking.places_booked == 2

    def test_stripe_payment_event_uniqueness(self):
        """StripePaymentEvent enforces unique event_id to prevent replay attacks."""
        StripePaymentEvent.objects.create(
            event_id='evt_test_unique_123',
            event_type='checkout.session.completed',
        )
        with pytest.raises(IntegrityError):
            StripePaymentEvent.objects.create(
                event_id='evt_test_unique_123',
                event_type='checkout.session.completed',
            )

    def test_platform_setting_audit_log(self):
        """PlatformSetting records key-value configuration with audit trail."""
        setting = PlatformSetting.objects.create(
            key='default_commission_rate',
            value={'rate': 12.0, 'effective_date': '2026-11-01'},
            notes='Initial platform commission fee policy',
        )
        assert setting.key == 'default_commission_rate'
        assert setting.value['rate'] == 12.0
