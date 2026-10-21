"""Administration models for the Mingler platform.

Manages platform-wide settings including commission rates
and stores an audit trail of admin actions.
"""
from django.db import models

from apps.core.models import BaseModel


class PlatformSetting(BaseModel):
    """Platform-wide configuration settings with historical audit trail.

    Stores key-value pairs for platform configuration. The commission_rate
    is stored as a setting with versioning to maintain an audit log.
    """

    key = models.CharField(
        max_length=100,
        db_index=True,
        help_text='Setting identifier (e.g., "commission_rate").',
    )
    value = models.JSONField(
        help_text='Setting value in JSON format.',
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='platform_settings_updated',
    )
    notes = models.TextField(
        blank=True,
        help_text='Reason for this setting change.',
    )

    class Meta:
        db_table = 'platform_settings'
        verbose_name = 'Platform Setting'
        verbose_name_plural = 'Platform Settings'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.key} = {self.value}'
