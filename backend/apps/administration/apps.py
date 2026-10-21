from django.apps import AppConfig


class AdministrationConfig(AppConfig):
    """Configuration for the administration application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.administration'
    verbose_name = 'Administration'
