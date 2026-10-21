"""Django management command to seed authentic London Venues and Mingles from the Base44 specification."""
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.mingles.models import Mingle
from apps.venues.models import Venue, VenueOpeningHour


class Command(BaseCommand):
    help = 'Seeds realistic London venues and curated Mingles based on Base44 specification.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding London venues and mingles...'))

        venues_data = [
            {
                'name': 'The Shoreditch Social & Cocktail Lounge',
                'category': 'Cocktail Bar & Lounge',
                'area': 'Shoreditch',
                'address': '142 Shoreditch High Street',
                'postcode': 'E1 6JE',
                'description': 'A vibrant, brick-walled cocktail loft featuring artisanal mixes, dim ambient lighting, and intimate communal booth seating perfect for curated conversations.',
                'status': 'approved',
                'commission_rate': Decimal('10.00'),
                'hours': [
                    (0, time(17, 0), time(23, 0)),
                    (1, time(17, 0), time(23, 0)),
                    (2, time(17, 0), time(23, 0)),
                    (3, time(17, 0), time(0, 0)),
                    (4, time(16, 0), time(1, 0)),
                    (5, time(16, 0), time(1, 0)),
                    (6, time(16, 0), time(22, 30)),
                ],
            },
            {
                'name': 'Brixton Cellar & Wine Taproom',
                'category': 'Wine Bar & Taproom',
                'area': 'Brixton',
                'address': '28 Coldharbour Lane',
                'postcode': 'SW9 8PR',
                'description': 'Specialists in European low-intervention wines and curated cheese platters. Set around a long oak sharing table ideal for group wine discoveries.',
                'status': 'approved',
                'commission_rate': Decimal('12.00'),
                'hours': [
                    (2, time(17, 0), time(23, 0)),
                    (3, time(17, 0), time(23, 0)),
                    (4, time(16, 0), time(0, 0)),
                    (5, time(14, 0), time(0, 0)),
                    (6, time(14, 0), time(21, 0)),
                ],
            },
            {
                'name': 'Soho Velvet Supper Room',
                'category': 'Fine Dining & Bistro',
                'area': 'Soho',
                'address': '45 Dean Street',
                'postcode': 'W1D 4PZ',
                'description': 'Modern British cuisine served family-style across communal banquet tables. An atmospheric dining salon with jazz playlists and warm candlelight.',
                'status': 'approved',
                'commission_rate': Decimal('10.00'),
                'hours': [
                    (1, time(18, 0), time(23, 30)),
                    (2, time(18, 0), time(23, 30)),
                    (3, time(18, 0), time(23, 30)),
                    (4, time(18, 0), time(0, 0)),
                    (5, time(17, 30), time(0, 30)),
                    (6, time(17, 30), time(0, 30)),
                ],
            },
            {
                'name': 'Hackney Canvas Art Studio',
                'category': 'Creative Studio & Gallery',
                'area': 'Hackney',
                'address': '18 Amhurst Terrace',
                'postcode': 'E8 2BT',
                'description': 'High-ceilinged industrial studio hosting social canvas painting, clay workshops, and craft sessions with complimentary prosecco.',
                'status': 'approved',
                'commission_rate': Decimal('15.00'),
                'hours': [
                    (3, time(18, 0), time(22, 0)),
                    (4, time(18, 0), time(22, 0)),
                    (5, time(11, 0), time(21, 0)),
                    (6, time(12, 0), time(19, 0)),
                ],
            },
            {
                'name': 'Covent Garden Secret Garden Cafe',
                'category': 'Brunch & Garden Cafe',
                'area': 'Covent Garden',
                'address': '12 Floral Street',
                'postcode': 'WC2E 9DG',
                'description': 'Lush botanical conservatory serving bottomless farm-to-table brunch, specialty roast coffees, and seasonal baked delights.',
                'status': 'approved',
                'commission_rate': Decimal('10.00'),
                'hours': [
                    (4, time(9, 0), time(17, 0)),
                    (5, time(9, 0), time(18, 0)),
                    (6, time(10, 0), time(18, 0)),
                ],
            },
        ]

        created_venues = {}
        for v_data in venues_data:
            hours = v_data.pop('hours')
            venue, created = Venue.objects.get_or_create(
                name=v_data['name'],
                defaults=v_data,
            )
            created_venues[venue.name] = venue

            # Add opening hours
            for day, open_t, close_t in hours:
                VenueOpeningHour.objects.get_or_create(
                    venue=venue,
                    day_of_week=day,
                    defaults={'open_time': open_t, 'close_time': close_t, 'is_closed': False},
                )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Venue: {venue.name}'))

        # Dates: next week and following weeks
        today = timezone.now().date()

        mingles_data = [
            {
                'venue': created_venues['The Shoreditch Social & Cocktail Lounge'],
                'title': 'Shoreditch Friday Cocktail Mix & Mingle',
                'experience_type': 'cocktails',
                'event_date': today + timedelta(days=7),
                'start_time': time(19, 30),
                'duration_minutes': 120,
                'ticket_price': Decimal('32.00'),
                'capacity': 18,
                'age_min': 23,
                'age_max': 36,
                'description': 'Kick off your weekend in Shoreditch! Enjoy 2 handcrafted signature cocktails on arrival, followed by curated icebreakers and great conversations with like-minded Londoners.',
                'status': 'published',
            },
            {
                'venue': created_venues['Brixton Cellar & Wine Taproom'],
                'title': 'Brixton Natural Wine & Artisanal Cheese Flight',
                'experience_type': 'wine_tasting',
                'event_date': today + timedelta(days=9),
                'start_time': time(19, 0),
                'duration_minutes': 120,
                'ticket_price': Decimal('38.00'),
                'capacity': 14,
                'age_min': 25,
                'age_max': 42,
                'description': 'An intimate guided tasting of 4 rare European natural wines paired with British farm cheeses. Perfect for wine enthusiasts and curious foodies looking to meet new friends.',
                'status': 'published',
            },
            {
                'venue': created_venues['Soho Velvet Supper Room'],
                'title': 'Saturday Candlelight Social Supper in Soho',
                'experience_type': 'dinner',
                'event_date': today + timedelta(days=14),
                'start_time': time(20, 0),
                'duration_minutes': 150,
                'ticket_price': Decimal('54.00'),
                'capacity': 16,
                'age_min': 26,
                'age_max': 40,
                'description': 'A three-course seasonal British feast served sharing-style across candlelit tables in the heart of Soho. Includes welcome glass of sparkling wine.',
                'status': 'published',
            },
            {
                'venue': created_venues['Covent Garden Secret Garden Cafe'],
                'title': 'Sunday Botanical Garden Social Brunch',
                'experience_type': 'brunch',
                'event_date': today + timedelta(days=15),
                'start_time': time(11, 30),
                'duration_minutes': 120,
                'ticket_price': Decimal('28.00'),
                'capacity': 16,
                'age_min': 21,
                'age_max': 35,
                'description': 'Relaxed Sunday morning brunch in a heated botanical greenhouse. Enjoy artisan pastries, signature hot dishes, and specialty coffee while getting to know fellow brunch lovers.',
                'status': 'published',
            },
            {
                'venue': created_venues['Hackney Canvas Art Studio'],
                'title': 'Sip & Paint Social: London Skyline & Prosecco',
                'experience_type': 'cultural',
                'event_date': today + timedelta(days=21),
                'start_time': time(18, 30),
                'duration_minutes': 120,
                'ticket_price': Decimal('36.00'),
                'capacity': 20,
                'age_min': 22,
                'age_max': 45,
                'description': 'All materials, canvases, and paints included! Paint your own impression of the London skyline with music, laughter, and bottomless prosecco.',
                'status': 'published',
            },
            {
                'venue': created_venues['The Shoreditch Social & Cocktail Lounge'],
                'title': 'Retro Board Games & Craft Beer Night',
                'experience_type': 'games',
                'event_date': today + timedelta(days=12),
                'start_time': time(19, 0),
                'duration_minutes': 120,
                'ticket_price': Decimal('18.00'),
                'capacity': 22,
                'age_min': 21,
                'age_max': 38,
                'description': 'Social deduction, trivia, and strategy board games hosted by our lively game master. Ideal for newcomers and friendly competition.',
                'status': 'published',
            },
        ]

        for m_data in mingles_data:
            mingle, created = Mingle.objects.get_or_create(
                venue=m_data['venue'],
                title=m_data['title'],
                defaults=m_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Mingle: {mingle.title} ({mingle.event_date})'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded all London venues and mingles!'))
