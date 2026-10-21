"""Signal handlers for the users application.

Automatically creates a Profile instance when a new User is registered.
"""
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a Profile for every newly registered User."""
    if created:
        from apps.users.models import Profile
        Profile.objects.create(
            user=instance,
            display_name=instance.email.split('@')[0],
        )
