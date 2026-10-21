"""Service layer for platform administration, approvals, and dynamic settings."""
import logging
from typing import Any, Optional
from django.db import transaction

from apps.administration.models import PlatformSetting
from apps.mingles.models import Mingle
from apps.users.models import User
from apps.venues.models import Venue

logger = logging.getLogger(__name__)


class ApprovalService:
    """Encapsulates founder decisions for pending venues and submitted mingles."""

    @classmethod
    @transaction.atomic
    def decide_venue(cls, venue: Venue, action: str, admin_user: User) -> Venue:
        """Approve or reject a pending venue registration.

        Args:
            venue: Target Venue instance.
            action: Either 'approve' or 'reject'.
            admin_user: Platform administrator taking the action.

        Returns:
            Updated Venue instance.
        """
        if action == 'approve':
            venue.status = 'approved'
        elif action == 'reject':
            venue.status = 'rejected'
        else:
            raise ValueError(f"Invalid venue approval action: {action}")

        venue.save(update_fields=['status', 'updated_at'])
        logger.info(
            "Venue '%s' (ID: %s) marked '%s' by admin %s",
            venue.name,
            venue.id,
            venue.status,
            admin_user.email,
        )
        return venue

    @classmethod
    @transaction.atomic
    def decide_mingle(
        cls,
        mingle: Mingle,
        action: str,
        curator_notes: str,
        admin_user: User,
    ) -> Mingle:
        """Approve, request changes, or reject a submitted Mingle proposal.

        Args:
            mingle: Target Mingle proposal instance.
            action: 'approve' (publishes live), 'changes_requested', or 'reject'.
            curator_notes: Feedback notes provided by the founder.
            admin_user: Platform administrator taking the action.

        Returns:
            Updated Mingle instance.
        """
        update_fields = ['status', 'updated_at']

        if action == 'approve':
            mingle.status = 'published'
        elif action == 'changes_requested':
            mingle.status = 'changes_requested'
        elif action == 'reject':
            mingle.status = 'cancelled'
        else:
            raise ValueError(f"Invalid mingle approval action: {action}")

        if curator_notes:
            mingle.curator_notes = curator_notes
            update_fields.append('curator_notes')

        mingle.save(update_fields=update_fields)
        logger.info(
            "Mingle '%s' (ID: %s) transitioned to status '%s' by admin %s",
            mingle.title,
            mingle.id,
            mingle.status,
            admin_user.email,
        )
        return mingle


class PlatformSettingService:
    """Manages platform configuration values with historical audit tracking."""

    COMMISSION_KEY = 'commission_rate'
    DEFAULT_COMMISSION = 10.00

    @classmethod
    def get_setting(cls, key: str, default: Any = None) -> Any:
        """Retrieve the latest value for a platform setting."""
        setting = PlatformSetting.objects.filter(key=key).order_by('-created_at').first()
        return setting.value if setting else default

    @classmethod
    def set_setting(cls, key: str, value: Any, user: User, notes: str = '') -> PlatformSetting:
        """Create a new versioned record for a platform setting (preserving audit history)."""
        setting = PlatformSetting.objects.create(
            key=key,
            value=value,
            updated_by=user,
            notes=notes,
        )
        logger.info("Platform setting '%s' set to %s by admin %s", key, value, user.email)
        return setting
