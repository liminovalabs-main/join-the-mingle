from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Configuration for the users application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Users & Profiles'

    def ready(self):
        """Import signal handlers when the app is ready."""
        import apps.users.signals  # noqa: F401
