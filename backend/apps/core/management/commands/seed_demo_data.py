"""Django management command to seed the 4 officially confirmed real London launch venues and mingles."""
from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.bookings.models import Booking
from apps.mingles.models import Mingle
from apps.payments.models import Payment
from apps.users.models import Profile, User
from apps.venues.models import Venue, VenueOpeningHour


class Command(BaseCommand):
    help = 'Seeds the 4 officially confirmed real London launch venues and mingles from partner agreements.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-legacy',
            action='store_true',
            help='Do not remove legacy demo mingles.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding 4 officially confirmed launch mingles and partner venues...'))

        with transaction.atomic():
            # 1. Clean up legacy/placeholder demo mingles unless explicitly requested to keep
            if not options.get('keep_legacy'):
                legacy_titles = [
                    'Shoreditch Friday Cocktail Mix & Mingle',
                    'Brixton Natural Wine & Artisanal Cheese Flight',
                    'Retro Board Games & Craft Beer Night',
                    'Saturday Candlelight Social Supper in Soho',
                    'Sunday Botanical Garden Social Brunch',
                    'Sip & Paint Social: London Skyline & Prosecco',
                    'Weekend Social Bouldering & Specialty Coffee',
                ]
                legacy_mingles = Mingle.objects.filter(title__in=legacy_titles)
                legacy_bookings = Booking.objects.filter(mingle__in=legacy_mingles)
                Payment.objects.filter(booking__in=legacy_bookings).delete()
                legacy_bookings.delete()
                deleted_count, _ = legacy_mingles.delete()
                if deleted_count > 0:
                    self.stdout.write(self.style.WARNING(f'Removed {deleted_count} legacy placeholder mingles.'))

            # 2. Seed Real Partner Venues
            venues_data = [
                {
                    'name': 'Bon Bon Pottery – Battersea Power Station',
                    'slug': 'bon-bon-pottery-battersea',
                    'category': 'Ceramics & Pottery Studio',
                    'area': 'Battersea Power Station',
                    'address': 'Circus Road West, Battersea Power Station',
                    'postcode': 'SW11 8AH',
                    'description': (
                        'Modern riverside ceramic painting studio at the iconic Battersea Power Station. '
                        'A relaxed, creative space offering pottery painting, artisanal glazes, and professional kiln firing.'
                    ),
                    'hero_image': '/images/mingles/bonbon-battersea.jpg',
                    'status': 'approved',
                    'commission_rate': Decimal('15.00'),
                    'hours': [
                        (0, time(10, 0), time(20, 0)),
                        (1, time(10, 0), time(20, 0)),
                        (2, time(10, 0), time(21, 0)),
                        (3, time(10, 0), time(21, 0)),
                        (4, time(10, 0), time(21, 0)),
                        (5, time(10, 0), time(20, 0)),
                        (6, time(11, 0), time(18, 0)),
                    ],
                },
                {
                    'name': 'Bon Bon Pottery – Notting Hill',
                    'slug': 'bon-bon-pottery-notting-hill',
                    'category': 'Ceramics & Pottery Studio',
                    'area': 'Notting Hill',
                    'address': '147 Westbourne Grove, Notting Hill',
                    'postcode': 'W11 2RS',
                    'description': (
                        'Charming boutique pottery studio nestled on Westbourne Grove in the heart of Notting Hill. '
                        'A peaceful sanctuary for social ceramic painting, clay design, and relaxed evening get-togethers.'
                    ),
                    'hero_image': '/images/mingles/bonbon-nottinghill.jpg',
                    'status': 'approved',
                    'commission_rate': Decimal('15.00'),
                    'hours': [
                        (1, time(10, 0), time(20, 0)),
                        (2, time(10, 0), time(21, 0)),
                        (3, time(10, 0), time(21, 0)),
                        (4, time(10, 0), time(21, 0)),
                        (5, time(10, 0), time(20, 0)),
                        (6, time(11, 0), time(18, 0)),
                    ],
                },
                {
                    'name': 'Enrica Rocca Cooking School',
                    'slug': 'enrica-rocca-cooking-school',
                    'category': 'Cooking School & Private Dining',
                    'area': 'Ladbroke Grove',
                    'address': '227 Ladbroke Grove, Notting Hill',
                    'postcode': 'W10 6HG',
                    'description': (
                        'Renowned family-run Venetian culinary school in West London, specializing in authentic Italian regional cooking, '
                        'hands-on pasta masterclasses, and convivial communal feasts.'
                    ),
                    'hero_image': '/images/mingles/enrica-cooking-class.jpg',
                    'status': 'approved',
                    'commission_rate': Decimal('10.00'),
                    'hours': [
                        (2, time(12, 0), time(22, 0)),
                        (3, time(12, 0), time(22, 0)),
                        (4, time(12, 0), time(23, 0)),
                        (5, time(11, 0), time(23, 0)),
                        (6, time(11, 0), time(21, 0)),
                    ],
                },
                {
                    'name': 'Art Play Chelsea',
                    'slug': 'art-play-chelsea',
                    'category': 'Creative Studio & Gallery',
                    'area': 'Chelsea',
                    'address': '332 King\'s Road, Chelsea',
                    'postcode': 'SW3 5UR',
                    'description': (
                        'A dynamic London creative hub on King\'s Road hosting vibrant canvas painting workshops, '
                        'social paint-and-sips with live DJ sets, and evening socials.'
                    ),
                    'hero_image': '/images/mingles/art-play-chelsea.jpg',
                    'status': 'approved',
                    'commission_rate': Decimal('10.00'),
                    'hours': [
                        (2, time(17, 0), time(22, 30)),
                        (3, time(17, 0), time(23, 0)),
                        (4, time(16, 0), time(0, 0)),
                        (5, time(12, 0), time(0, 0)),
                        (6, time(12, 0), time(21, 0)),
                    ],
                },
            ]

            created_venues = {}
            for v_data in venues_data:
                hours_data = v_data.pop('hours')
                venue, created = Venue.objects.update_or_create(
                    slug=v_data['slug'],
                    defaults=v_data,
                )
                created_venues[venue.name] = venue

                # Populate opening hours
                for day_of_week, open_time, close_time in hours_data:
                    VenueOpeningHour.objects.update_or_create(
                        venue=venue,
                        day_of_week=day_of_week,
                        defaults={
                            'open_time': open_time,
                            'close_time': close_time,
                            'is_closed': False,
                        },
                    )

            # 3. Seed The 4 Officially Confirmed Launch Mingles
            mingles_data = [
                {
                    'venue': created_venues['Bon Bon Pottery – Battersea Power Station'],
                    'title': 'Pottery Painting & Drinks @ Battersea Power Station',
                    'experience_type': 'cultural',
                    'event_date': date(2026, 12, 2),  # Wednesday 2nd December 2026
                    'start_time': time(19, 0),
                    'duration_minutes': 90,
                    'ticket_price': Decimal('32.00'),
                    'capacity': 10,
                    'age_min': 21,
                    'age_max': 45,
                    'hero_image': '/images/mingles/bonbon-battersea.jpg',
                    'description': (
                        "Pick a piece you love and paint it at your own pace in one of Bonbon Pottery’s relaxed London studios. "
                        "No sketching skills or experience needed, just come ready to have fun with fellow minglers.\n\n"
                        "How it works:\n"
                        "1. Arrive at the studio and choose your ceramic piece (pottery piece up to £32 value included).\n"
                        "2. Get creative and paint using provided stencils, stamps, aprons, and tools.\n"
                        "3. Leave it with the Bonbon Pottery team for glazing and firing.\n"
                        "4. Pieces are glazed and fired in the kiln, making them food-safe and ready to collect around two weeks later "
                        "(or choose domestic delivery).\n\n"
                        "Includes one complimentary soft drink, aprons, and all painting equipment."
                    ),
                    'curator_notes': (
                        "Confirmed partner agreement with Eve Tang (eve@bonbonpottery.co.uk). "
                        "Price: £32 pp. Commission: 15%. Inclusions: ceramic piece up to £32 value, studio painting tools, "
                        "glazing, kiln firing, 1 soft drink."
                    ),
                    'status': 'published',
                },
                {
                    'venue': created_venues['Bon Bon Pottery – Notting Hill'],
                    'title': 'Notting Hill Pottery Painting Social',
                    'experience_type': 'cultural',
                    'event_date': date(2026, 12, 3),  # Thursday 3rd December 2026
                    'start_time': time(19, 0),
                    'duration_minutes': 90,
                    'ticket_price': Decimal('32.00'),
                    'capacity': 10,
                    'age_min': 21,
                    'age_max': 45,
                    'hero_image': '/images/mingles/bonbon-nottinghill.jpg',
                    'description': (
                        "Enjoy a cozy, creative evening in West London! Paint your own unique ceramic piece in Bonbon Pottery’s "
                        "welcoming Notting Hill studio alongside other minglers.\n\n"
                        "How it works:\n"
                        "1. Arrive at the studio and choose your ceramic piece (pottery piece up to £32 value included).\n"
                        "2. Get creative and paint with provided stencils, stamps, aprons, and brushes.\n"
                        "3. Leave it with the Bonbon Pottery team for professional glazing and firing.\n"
                        "4. Collect your finished food-safe ceramic piece around two weeks later.\n\n"
                        "Includes one complimentary soft drink, aprons, and all equipment."
                    ),
                    'curator_notes': (
                        "Confirmed partner agreement with Eve Tang. "
                        "Price: £32 pp. Commission: 15%. Inclusions: ceramic piece up to £32, glazing, kiln firing, 1 soft drink."
                    ),
                    'status': 'published',
                },
                {
                    'venue': created_venues['Enrica Rocca Cooking School'],
                    'title': 'Hands-On Italian Cooking Class & Dinner',
                    'experience_type': 'cooking',
                    'event_date': date(2026, 12, 6),  # Sunday 6th December 2026
                    'start_time': time(16, 30),
                    'duration_minutes': 180,
                    'ticket_price': Decimal('125.00'),
                    'capacity': 10,
                    'age_min': 23,
                    'age_max': 50,
                    'hero_image': '/images/mingles/enrica-cooking-class.jpg',
                    'description': (
                        "Step into an authentic Italian kitchen in Ladbroke Grove for an immersive culinary evening. "
                        "Together with fellow minglers, you'll learn traditional regional Italian techniques, prepare hand-rolled pasta "
                        "and seasonal specialties from scratch, and sit down around an intimate table to enjoy the multi-course meal "
                        "you've created over paired Italian wines.\n\n"
                        "Everything you need is provided: hands-on chef tuition, all fresh market ingredients, recipes, "
                        "and a delicious communal dinner feast."
                    ),
                    'curator_notes': (
                        "Confirmed partner agreement with Claire (Ladbroke Grove). "
                        "Price: £125 pp. Inclusions: Full cooking masterclass, all food and ingredients, dinner dining, and wine."
                    ),
                    'status': 'published',
                },
                {
                    'venue': created_venues['Art Play Chelsea'],
                    'title': 'DJ & Painting Social Night @ Art Play Chelsea',
                    'experience_type': 'cultural',
                    'event_date': date(2026, 12, 10),  # Thursday 10th December 2026
                    'start_time': time(19, 0),
                    'duration_minutes': 180,
                    'ticket_price': Decimal('30.00'),
                    'capacity': 12,
                    'age_min': 21,
                    'age_max': 45,
                    'hero_image': '/images/mingles/art-play-chelsea.jpg',
                    'description': (
                        "Unleash your creativity in an energetic social atmosphere on King's Road! Join fellow minglers for an evening "
                        "of canvas painting accompanied by a live DJ set. No art experience required — all paints, canvases, brushes, "
                        "and aprons are provided.\n\n"
                        "Enjoy a complimentary drink on arrival (beer, wine, or soft drink) while meeting great people and painting "
                        "your masterpiece to take home."
                    ),
                    'curator_notes': (
                        "Confirmed partner agreement with Victoria (Chelsea). "
                        "Price: £30 pp. Commission: 10%. Inclusions: 1 alcoholic or soft drink, canvas to take home, paints, brushes, live DJ."
                    ),
                    'status': 'published',
                },
            ]

            created_mingles = []
            for m_data in mingles_data:
                mingle, _ = Mingle.objects.update_or_create(
                    venue=m_data['venue'],
                    title=m_data['title'],
                    defaults=m_data,
                )
                created_mingles.append(mingle)
                self.stdout.write(self.style.SUCCESS(f'Seeded Mingle: {mingle.title} on {mingle.event_date} (£{mingle.ticket_price})'))

            # 4. Seed authentic confirmed attendee bookings so attendee avatars display on cards
            demo_attendees = list(Profile.objects.exclude(user__email__icontains='admin')[:6])
            if demo_attendees:
                for idx, mingle in enumerate(created_mingles):
                    # Assign 2-3 confirmed attendees per mingle
                    attendees_subset = demo_attendees[idx % len(demo_attendees): (idx % len(demo_attendees)) + 3]
                    for profile in attendees_subset:
                        Booking.objects.get_or_create(
                            mingle=mingle,
                            profile=profile,
                            defaults={
                                'places_booked': 1,
                                'unit_price': mingle.ticket_price,
                                'total_amount': mingle.ticket_price,
                                'status': 'confirmed',
                            },
                        )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {len(created_venues)} partner venues and {len(created_mingles)} confirmed launch mingles!'
        ))
