"""Abstract base models for the Mingler platform.

Provides UUID primary keys and automatic timestamp fields
for all derived models across the project.
"""
import uuid

from django.db import models


class BaseModel(models.Model):
    """Abstract base model with UUID primary key and audit timestamps.

    All concrete models in the Mingler platform should inherit from
    this class to ensure consistent primary key strategy and
    automatic created/updated tracking.

    Attributes:
        id: UUID v4 primary key, auto-generated, non-editable.
        created_at: Timestamp set once on record creation.
        updated_at: Timestamp updated on every save.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Unique identifier for this record.',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when this record was created.',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp when this record was last updated.',
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.__class__.__name__}({self.id})'
