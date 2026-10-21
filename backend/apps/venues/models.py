"""Venue models for the Mingler platform.

Venues are physical locations in London that host Mingle experiences.
Each venue goes through an approval workflow before appearing publicly.
"""
import uuid

from django.db import models
from django.utils.text import slugify

from apps.core.models import BaseModel


class Venue(BaseModel):
    """A physical venue that hosts Mingle social experiences.

    Venues must be approved by a platform admin before they
    appear in the public directory.
    """

    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True, blank=True)
    category = models.CharField(max_length=50)
    area = models.CharField(
        max_length=100,
        help_text='London area/borough, e.g. "Shoreditch", "Mayfair".',
    )
    address = models.CharField(max_length=255)
    postcode = models.CharField(max_length=20)
    description = models.TextField()
    hero_image = models.ImageField(
        upload_to='venues/',
        max_length=500,
        blank=True,
        null=True,
        help_text='Venue hero/cover image file.',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        help_text='Platform commission percentage (e.g., 10.00 = 10%).',
    )

    class Meta:
        db_table = 'venues'
        verbose_name = 'Venue'
        verbose_name_plural = 'Venues'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from venue name if not provided."""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class VenueOpeningHour(models.Model):
    """Operating hours for a venue on a specific day of the week.

    Uses validated TimeField inputs — resolves the Base44 bug of
    unvalidated plain-text opening hours.
    """

    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    venue = models.ForeignKey(
        Venue,
        on_delete=models.CASCADE,
        related_name='opening_hours',
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        db_table = 'venue_opening_hours'
        unique_together = ('venue', 'day_of_week')
        ordering = ['day_of_week']

    def __str__(self) -> str:
        day = dict(self.DAY_CHOICES).get(self.day_of_week, '')
        if self.is_closed:
            return f'{self.venue.name} — {day}: Closed'
        return f'{self.venue.name} — {day}: {self.open_time}–{self.close_time}'


class VenueMember(BaseModel):
    """Associates a User with a Venue as a staff member or manager."""

    ROLE_CHOICES = (
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )

    venue = models.ForeignKey(
        Venue,
        on_delete=models.CASCADE,
        related_name='members',
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='venue_memberships',
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='staff',
    )

    class Meta:
        db_table = 'venue_members'
        unique_together = ('venue', 'user')

    def __str__(self) -> str:
        return f'{self.user.email} @ {self.venue.name} ({self.role})'
