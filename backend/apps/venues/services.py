"""Service layer for the Venues domain."""
import logging
from typing import Any, Dict, List
from django.db import transaction

from apps.users.models import User
from apps.venues.models import Venue, VenueMember, VenueOpeningHour

logger = logging.getLogger(__name__)


class VenueService:
    """Encapsulates business operations for venues, memberships, and operating schedules."""

    @classmethod
    @transaction.atomic
    def register_venue(cls, user: User, validated_data: Dict[str, Any]) -> Venue:
        """Register a new venue application for an authenticated user.

        - Creates Venue with status='pending' awaiting founder approval.
        - Automatically creates VenueMember associating caller as 'manager'.
        - Promotes User.role to 'venue_manager' if currently 'member'.

        Args:
            user: Authenticated user submitting the application.
            validated_data: Validated venue attributes from VenueRegistrationSerializer.

        Returns:
            Newly created pending Venue instance.
        """
        venue = Venue.objects.create(
            status='pending',
            **validated_data,
        )

        VenueMember.objects.create(
            venue=venue,
            user=user,
            role='manager',
        )

        if user.role == 'member':
            user.role = 'venue_manager'
            user.save(update_fields=['role'])

        logger.info(
            "Venue '%s' (ID: %s) registered with status 'pending' by user %s",
            venue.name,
            venue.id,
            user.email,
        )
        return venue

    @classmethod
    @transaction.atomic
    def update_opening_hours(
        cls,
        venue: Venue,
        hours_data: List[Dict[str, Any]],
    ) -> List[VenueOpeningHour]:
        """Configure or update the 7-day operating schedule for a venue.

        Args:
            venue: The target Venue instance.
            hours_data: List of day configs with day_of_week, open_time, close_time, is_closed.

        Returns:
            List of updated VenueOpeningHour instances.
        """
        updated_records = []
        for item in hours_data:
            day_of_week = item['day_of_week']
            open_time = item.get('open_time')
            close_time = item.get('close_time')
            is_closed = item.get('is_closed', False)

            hour_record, _ = VenueOpeningHour.objects.update_or_create(
                venue=venue,
                day_of_week=day_of_week,
                defaults={
                    'open_time': None if is_closed else open_time,
                    'close_time': None if is_closed else close_time,
                    'is_closed': is_closed,
                },
            )
            updated_records.append(hour_record)

        logger.info("Updated %d opening hour records for Venue %s", len(updated_records), venue.name)
        return updated_records

    @classmethod
    def can_manage_venue(cls, venue: Venue, user: User) -> bool:
        """Verify whether a user is authorized to manage the specified venue."""
        if not user or not user.is_authenticated:
            return False
        if user.role == 'admin':
            return True
        return VenueMember.objects.filter(venue=venue, user=user).exists()
