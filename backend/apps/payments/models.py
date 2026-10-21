"""Payment models for the Mingler platform.

Tracks Stripe checkout sessions, payment intents, and ensures
idempotent webhook processing via StripePaymentEvent deduplication.
"""
from django.db import models

from apps.core.models import BaseModel


class Payment(BaseModel):
    """Records a completed payment linked to a Booking."""

    CURRENCY_CHOICES = (
        ('GBP', 'British Pounds'),
    )

    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.PROTECT,
        related_name='payment',
    )
    stripe_checkout_session_id = models.CharField(
        max_length=255,
        unique=True,
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
    )
    amount_paid = models.DecimalField(
        max_digits=8,
        decimal_places=2,
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='GBP',
    )
    payment_status = models.CharField(
        max_length=20,
        default='succeeded',
    )

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self) -> str:
        return f'Payment £{self.amount_paid} for Booking {self.booking_id}'


class StripePaymentEvent(models.Model):
    """Deduplicated log of processed Stripe webhook events.

    Prevents replay attacks and duplicate processing by storing
    the unique event_id from each webhook delivery.
    """

    event_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text='Stripe event ID (e.g., evt_xxx).',
    )
    event_type = models.CharField(
        max_length=100,
        help_text='Stripe event type (e.g., checkout.session.completed).',
    )
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stripe_payment_events'
        verbose_name = 'Stripe Payment Event'
        verbose_name_plural = 'Stripe Payment Events'

    def __str__(self) -> str:
        return f'{self.event_type} — {self.event_id}'
