"""Matching service for evaluating post-mingle mutual selections and creating connections."""
import logging
from typing import List, Tuple
from uuid import UUID
from django.db import transaction

from apps.interactions.models import Connection, MingleSelection
from apps.mingles.models import Mingle
from apps.notifications.tasks import send_mutual_match_notification_task
from apps.users.models import Profile

logger = logging.getLogger(__name__)


class MatchingService:
    """Evaluates attendee selections to form verified mutual Connections."""

    @classmethod
    def record_selections_and_evaluate(
        cls,
        mingle: Mingle,
        selector_profile: Profile,
        target_profile_ids: List[UUID],
    ) -> Tuple[int, int]:
        """Records attendee selections and creates Connections for bidirectional matches.

        Args:
            mingle: The Mingle experience where the interaction occurred.
            selector_profile: Profile of the member making selections.
            target_profile_ids: List of profile IDs the member is interested in.

        Returns:
            Tuple of (selections_recorded_count, new_mutual_connections_count).
        """
        # Filter out self-selection
        clean_target_ids = [
            pid for pid in target_profile_ids
            if str(pid) != str(selector_profile.id)
        ]

        if not clean_target_ids:
            return 0, 0

        target_profiles = Profile.objects.filter(id__in=clean_target_ids)

        selections_recorded = 0
        new_connections_count = 0

        with transaction.atomic():
            for target in target_profiles:
                # 1. Record selection (idempotent get_or_create)
                _, created = MingleSelection.objects.get_or_create(
                    mingle=mingle,
                    selector=selector_profile,
                    target=target,
                )
                if created:
                    selections_recorded += 1

                # 2. Check for reciprocal interest (Did target already select selector?)
                has_reciprocal = MingleSelection.objects.filter(
                    mingle=mingle,
                    selector=target,
                    target=selector_profile,
                ).exists()

                if has_reciprocal:
                    # Enforce deterministic ordering for profile_a and profile_b to prevent inverted duplicates
                    profile_a, profile_b = (
                        (selector_profile, target)
                        if str(selector_profile.id) < str(target.id)
                        else (target, selector_profile)
                    )

                    conn, conn_created = Connection.objects.get_or_create(
                        mingle=mingle,
                        profile_a=profile_a,
                        profile_b=profile_b,
                    )

                    if conn_created:
                        new_connections_count += 1
                        logger.info(
                            "Mutual match formed between %s and %s for Mingle %s",
                            selector_profile.display_name,
                            target.display_name,
                            mingle.title,
                        )
                        # Dispatch asynchronous celebration email notification
                        send_mutual_match_notification_task.delay(str(conn.id))

        return selections_recorded, new_connections_count
