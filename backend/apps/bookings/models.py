"""Booking models for the Mingler platform.

Handles ticket reservations with concurrency-safe capacity checks
and date guard validation to prevent past-event bookings.
"""
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class Booking(BaseModel):
    """A ticket reservation for a specific Mingle event.

    Concurrency Safety:
        Booking creation uses select_for_update() row-level locking
        to prevent overbooking when multiple users attempt to reserve
        the last available seats simultaneously.

    Date Guard:
        Bookings for past events are rejected at the service layer,
        permanently fixing the Base44 defect #3.
    """

    STATUS_CHOICES = (
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )

    mingle = models.ForeignKey(
        'mingles.Mingle',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    profile = models.ForeignKey(
        'users.Profile',
        on_delete=models.PROTECT,
        related_name='bookings',
    )
    places_booked = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    unit_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='Snapshot of ticket price at booking time.',
    )
    total_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='unit_price × places_booked.',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
    )

    class Meta:
        db_table = 'bookings'
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(places_booked__gte=1, places_booked__lte=5),
                name='valid_places_range',
            ),
        ]

    def __str__(self) -> str:
        return f'Booking {self.id} — {self.profile.display_name} × {self.places_booked}'
