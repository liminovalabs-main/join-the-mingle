"""Django admin configuration for Payment models."""
from django.contrib import admin

from apps.payments.models import Payment, StripePaymentEvent


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'amount_paid', 'currency', 'payment_status', 'created_at')
    list_filter = ('payment_status', 'currency')
    search_fields = ('stripe_checkout_session_id', 'stripe_payment_intent_id')
    readonly_fields = ('stripe_checkout_session_id', 'stripe_payment_intent_id')


@admin.register(StripePaymentEvent)
class StripePaymentEventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'event_type', 'processed_at')
    list_filter = ('event_type',)
    search_fields = ('event_id',)
