"""Mingle models for the Mingler platform.

A Mingle is a curated social experience hosted at a venue.
Mingles go through an approval lifecycle before being published.
"""
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class Mingle(BaseModel):
    """A curated social experience event.

    Lifecycle statuses:
        draft → submitted → (approved | changes_requested) → published → completed | cancelled
    """

    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('changes_requested', 'Changes Requested'),
        ('approved', 'Approved'),
        ('published', 'Published Live'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    EXPERIENCE_TYPE_CHOICES = (
        ('dinner', 'Dinner Party'),
        ('cocktails', 'Cocktail Evening'),
        ('wine_tasting', 'Wine Tasting'),
        ('brunch', 'Brunch'),
        ('cooking', 'Cooking Class'),
        ('games', 'Games Night'),
        ('cultural', 'Cultural Experience'),
        ('wellness', 'Wellness & Mindfulness'),
        ('other', 'Other'),
    )

    venue = models.ForeignKey(
        'venues.Venue',
        on_delete=models.PROTECT,
        related_name='mingles',
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    experience_type = models.CharField(
        max_length=50,
        choices=EXPERIENCE_TYPE_CHOICES,
    )
    event_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    duration_minutes = models.IntegerField(
        default=120,
        validators=[MinValueValidator(30)],
    )
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='Price per ticket in GBP (£).',
    )
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text='Maximum number of attendees.',
    )
    age_min = models.PositiveIntegerField(
        default=18,
        help_text='Minimum age requirement.',
    )
    age_max = models.PositiveIntegerField(
        default=99,
        help_text='Maximum age limit.',
    )
    hero_image = models.ImageField(
        upload_to='mingles/',
        max_length=500,
        blank=True,
        null=True,
        help_text='Mingle experience hero/cover image file.',
    )
    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
    )
    curator_notes = models.TextField(
        blank=True,
        help_text='Internal notes from admin during approval review.',
    )

    class Meta:
        db_table = 'mingles'
        verbose_name = 'Mingle'
        verbose_name_plural = 'Mingles'
        ordering = ['event_date', 'start_time']

    def __str__(self) -> str:
        return f'{self.title} — {self.event_date}'
