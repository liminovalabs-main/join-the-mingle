"""Interaction models for the Mingler platform.

Handles post-mingle feedback, mutual matching selections,
bi-directional connections, and venue reviews.
"""
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class MingleSelection(BaseModel):
    """A member's post-mingle selection indicating interest in another attendee.

    When two members select each other for the same mingle,
    a mutual Connection is created by the matching algorithm.
    """

    mingle = models.ForeignKey(
        'mingles.Mingle',
        on_delete=models.CASCADE,
        related_name='selections',
    )
    selector = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='selections_made',
    )
    target = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='selections_received',
    )

    class Meta:
        db_table = 'mingle_selections'
        unique_together = ('mingle', 'selector', 'target')

    def __str__(self) -> str:
        return f'{self.selector.display_name} → {self.target.display_name} @ {self.mingle.title}'


class Connection(BaseModel):
    """A confirmed mutual match between two members from a specific Mingle.

    Created automatically when both members select each other
    during the post-mingle review phase.
    """

    mingle = models.ForeignKey(
        'mingles.Mingle',
        on_delete=models.CASCADE,
        related_name='connections',
    )
    profile_a = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='connections_as_a',
    )
    profile_b = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='connections_as_b',
    )
    is_celebrated = models.BooleanField(
        default=False,
        help_text='Whether both members have seen the celebration screen.',
    )

    class Meta:
        db_table = 'connections'
        unique_together = ('mingle', 'profile_a', 'profile_b')

    def __str__(self) -> str:
        return f'{self.profile_a.display_name} ↔ {self.profile_b.display_name}'


class Feedback(BaseModel):
    """Post-mingle experience feedback submitted by an attendee.

    Requires a confirmed booking (HasConfirmedAttendance permission)
    to prevent unauthorized reviews — fixes Base44 defect #4.
    """

    mingle = models.ForeignKey(
        'mingles.Mingle',
        on_delete=models.CASCADE,
        related_name='feedback',
    )
    author = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='feedback_given',
    )
    overall_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'feedback'
        unique_together = ('mingle', 'author')

    def __str__(self) -> str:
        return f'{self.author.display_name} rated {self.mingle.title}: {self.overall_rating}/5'


class VenueReview(BaseModel):
    """A review of a Venue submitted by a member who attended a Mingle there.

    Separated from Mingle Feedback to maintain 3NF — resolves the Base44
    static venue reviews bug (#7) by properly linking reviews to venues.
    """

    venue = models.ForeignKey(
        'venues.Venue',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    author = models.ForeignKey(
        'users.Profile',
        on_delete=models.CASCADE,
        related_name='venue_reviews_written',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)

    class Meta:
        db_table = 'venue_reviews'
        unique_together = ('venue', 'author')

    def __str__(self) -> str:
        return f'{self.author.display_name} reviewed {self.venue.name}: {self.rating}/5'
