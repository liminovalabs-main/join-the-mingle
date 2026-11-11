"""Automated regression tests for the 4 confirmed London launch mingles and seeding integrity."""
import pytest
from django.core.management import call_command
from apps.mingles.models import Mingle
from apps.mingles.serializers import MingleDetailSerializer, MingleListSerializer
from apps.venues.models import Venue
from apps.venues.serializers import VenueDetailSerializer, VenueListSerializer


@pytest.mark.django_db
class TestLaunchMinglesAndSeeding:
    """Verifies that the confirmed launch mingles are accurately configured and serialized."""

    @pytest.fixture(autouse=True)
    def setup_seed_data(self):
        """Seed the test database with launch data."""
        call_command('seed_demo_data')

    EXPECTED_TITLES = [
        'Pottery Painting & Drinks @ Battersea Power Station',
        'Notting Hill Pottery Painting Social',
        'Hands-On Italian Cooking Class & Dinner',
        'DJ & Painting Social Night @ Art Play Chelsea',
    ]

    LEGACY_TITLES = [
        'Shoreditch Friday Cocktail Mix & Mingle',
        'Brixton Natural Wine & Artisanal Cheese Flight',
        'Retro Board Games & Craft Beer Night',
        'Saturday Candlelight Social Supper in Soho',
        'Sunday Botanical Garden Social Brunch',
        'Sip & Paint Social: London Skyline & Prosecco',
        'Weekend Social Bouldering & Specialty Coffee',
    ]

    def test_legacy_demo_mingles_purged(self):
        """Ensure all obsolete placeholder demo mingles are completely absent."""
        found_legacy = Mingle.objects.filter(title__in=self.LEGACY_TITLES).count()
        assert found_legacy == 0, f"Found {found_legacy} unexpected legacy placeholder mingles."

    def test_four_confirmed_launch_mingles_exist(self):
        """Ensure all 4 confirmed launch mingles exist and are published."""
        for title in self.EXPECTED_TITLES:
            mingle = Mingle.objects.filter(title=title).first()
            assert mingle is not None, f"Expected launch mingle '{title}' was not found in DB."
            assert mingle.status == 'published', f"Launch mingle '{title}' is not published."
            assert mingle.capacity in (10, 12), f"Unexpected capacity {mingle.capacity} for '{title}'."
            assert mingle.ticket_price in (30.00, 32.00, 125.00), f"Unexpected price {mingle.ticket_price} for '{title}'."

    def test_mingle_serializer_preserves_relative_image_path(self):
        """Ensure MingleListSerializer and MingleDetailSerializer preserve relative /images/ paths."""
        mingle = Mingle.objects.filter(title='Pottery Painting & Drinks @ Battersea Power Station').first()
        assert mingle is not None

        list_data = MingleListSerializer(mingle).data
        assert list_data['hero_image'] == '/images/mingles/bonbon-battersea.jpg'

        detail_data = MingleDetailSerializer(mingle).data
        assert detail_data['hero_image'] == '/images/mingles/bonbon-battersea.jpg'

    def test_venue_serializer_preserves_relative_image_path(self):
        """Ensure VenueListSerializer and VenueDetailSerializer preserve relative /images/ paths."""
        venue = Venue.objects.filter(slug='bon-bon-pottery-battersea').first()
        assert venue is not None

        list_data = VenueListSerializer(venue).data
        assert list_data['hero_image'] == '/images/mingles/bonbon-battersea.jpg'

        detail_data = VenueDetailSerializer(venue).data
        assert detail_data['hero_image'] == '/images/mingles/bonbon-battersea.jpg'
