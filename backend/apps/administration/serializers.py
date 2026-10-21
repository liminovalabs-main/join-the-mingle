"""Serializers for platform administration and founder approvals."""
from decimal import Decimal
from rest_framework import serializers

from apps.administration.models import PlatformSetting
from apps.mingles.models import Mingle
from apps.venues.models import Venue


class VenueApprovalQueueSerializer(serializers.ModelSerializer):
    """Detailed serializer for pending venue applications in the founder approval queue."""

    manager_email = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    hero_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Venue
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'area',
            'address',
            'postcode',
            'description',
            'hero_image',
            'status',
            'commission_rate',
            'manager_email',
            'manager_name',
            'created_at',
        ]

    def get_manager_email(self, obj: Venue) -> str:
        manager_membership = obj.members.filter(role='manager').first()
        return manager_membership.user.email if manager_membership else ''

    def get_manager_name(self, obj: Venue) -> str:
        manager_membership = obj.members.filter(role='manager').first()
        if manager_membership and hasattr(manager_membership.user, 'profile'):
            return manager_membership.user.profile.display_name
        return ''


class VenueApprovalActionSerializer(serializers.Serializer):
    """Payload for approving or rejecting a venue application."""

    action = serializers.ChoiceField(
        choices=['approve', 'reject'],
        help_text="Action to take: 'approve' to publish live, 'reject' to decline.",
    )


class MingleApprovalQueueSerializer(serializers.ModelSerializer):
    """Serializer for submitted Mingle proposals in the founder approval queue."""

    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_area = serializers.CharField(source='venue.area', read_only=True)
    hero_image = serializers.ImageField(read_only=True)

    class Meta:
        model = Mingle
        fields = [
            'id',
            'venue',
            'venue_name',
            'venue_area',
            'title',
            'description',
            'experience_type',
            'event_date',
            'start_time',
            'duration_minutes',
            'ticket_price',
            'capacity',
            'age_min',
            'age_max',
            'hero_image',
            'status',
            'curator_notes',
            'created_at',
            'updated_at',
        ]


class MingleApprovalActionSerializer(serializers.Serializer):
    """Payload for founder decision on a submitted Mingle proposal."""

    ACTION_CHOICES = [
        ('approve', 'Approve & Publish Live'),
        ('changes_requested', 'Request Changes from Venue'),
        ('reject', 'Reject & Cancel'),
    ]

    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        help_text="Action to take on the proposal.",
    )
    curator_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text="Optional feedback or requested changes communicated to the venue manager.",
    )


class PlatformSettingSerializer(serializers.ModelSerializer):
    """Serializer for platform-wide settings."""

    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)

    class Meta:
        model = PlatformSetting
        fields = ['id', 'key', 'value', 'notes', 'updated_by_email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommissionSettingUpdateSerializer(serializers.Serializer):
    """Payload for updating the default platform commission rate."""

    commission_rate = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal('0.00'),
        max_value=Decimal('100.00'),
        help_text="Platform commission percentage (e.g. 10.00 for 10%).",
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text="Audit log reason for this commission update.",
    )
