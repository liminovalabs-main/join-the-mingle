from django.apps import AppConfig


class VenuesConfig(AppConfig):
    """Configuration for the venues application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.venues'
    verbose_name = 'Venues'
