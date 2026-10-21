"""Payment URL patterns for Project Mingler."""
from django.urls import path
from apps.payments.views import StripeCheckoutView, StripeWebhookView

urlpatterns = [
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('checkout-session/', StripeCheckoutView.as_view(), name='create-checkout-session'),
]
