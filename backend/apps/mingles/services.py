"""Service layer for Mingle proposal submissions and lifecycle."""
import logging
from typing import Any, Dict
from django.core.exceptions import PermissionDenied, ValidationError

from apps.mingles.models import Mingle
from apps.users.models import User
from apps.venues.models import Venue, VenueMember

logger = logging.getLogger(__name__)


class MingleProposalService:
    """Handles submission and validation of Mingle proposals by venue operators."""

    @classmethod
    def submit_proposal(cls, user: User, validated_data: Dict[str, Any]) -> Mingle:
        """Submit a new Mingle proposal for founder review.

        Args:
            user: Authenticated venue manager submitting the proposal.
            validated_data: Validated attributes from MingleProposalSerializer.

        Returns:
            Created Mingle instance with status='submitted'.

        Raises:
            ValidationError: If venue is not approved.
            PermissionDenied: If user is not authorized for the venue.
        """
        venue_id = validated_data.pop('venue_id')
        try:
            venue = Venue.objects.get(id=venue_id)
        except Venue.DoesNotExist:
            raise ValidationError("Target venue does not exist.")

        if venue.status != 'approved':
            raise ValidationError("Mingles can only be submitted for approved venues.")

        if user.role != 'admin' and not VenueMember.objects.filter(venue=venue, user=user).exists():
            raise PermissionDenied("You do not have management permissions for this venue.")

        mingle = Mingle.objects.create(
            venue=venue,
            status='submitted',
            **validated_data,
        )

        logger.info(
            "Mingle proposal '%s' (ID: %s) submitted for Venue '%s' by user %s",
            mingle.title,
            mingle.id,
            venue.name,
            user.email,
        )
        return mingle
