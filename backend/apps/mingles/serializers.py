"""Serializers for the Mingles catalog and dynamic attendee roster."""
from typing import Any, Dict
from django.db.models import Sum
from rest_framework import serializers

from apps.mingles.models import Mingle
from apps.users.serializers import PublicProfileSerializer
from apps.venues.models import Venue


class MingleVenueSummarySerializer(serializers.ModelSerializer):
    """Compact venue representation embedded within Mingle payloads."""

    class Meta:
        model = Venue
        fields = ['id', 'name', 'slug', 'category', 'area', 'address', 'postcode']


class MingleListSerializer(serializers.ModelSerializer):
    """Catalog list serializer with live capacity calculations."""

    hero_image = serializers.ImageField(read_only=True)
    venue = MingleVenueSummarySerializer(read_only=True)
    experience_type_display = serializers.CharField(source='get_experience_type_display', read_only=True)
    spots_remaining = serializers.SerializerMethodField()
    is_sold_out = serializers.SerializerMethodField()
    confirmed_attendees_count = serializers.SerializerMethodField()

    class Meta:
        model = Mingle
        fields = [
            'id',
            'title',
            'description',
            'experience_type',
            'experience_type_display',
            'event_date',
            'start_time',
            'duration_minutes',
            'ticket_price',
            'capacity',
            'hero_image',
            'status',
            'venue',
            'spots_remaining',
            'is_sold_out',
            'confirmed_attendees_count',
            'created_at',
        ]

    def get_spots_remaining(self, obj: Mingle) -> int:
        reserved = obj.bookings.filter(status__in=['pending', 'confirmed']).aggregate(total=Sum('places_booked'))['total'] or 0
        return max(0, obj.capacity - reserved)

    def get_is_sold_out(self, obj: Mingle) -> bool:
        return self.get_spots_remaining(obj) <= 0

    def get_confirmed_attendees_count(self, obj: Mingle) -> int:
        return obj.bookings.filter(status='confirmed').aggregate(total=Sum('places_booked'))['total'] or 0


class MingleDetailSerializer(MingleListSerializer):
    """Detailed Mingle serializer including age requirements and curator notes for staff."""

    curator_notes = serializers.SerializerMethodField()

    class Meta(MingleListSerializer.Meta):
        fields = MingleListSerializer.Meta.fields + [
            'age_min',
            'age_max',
            'curator_notes',
            'updated_at',
        ]

    def get_curator_notes(self, obj: Mingle) -> str:
        request = self.context.get('request')
        # Only admins, staff, and the hosting venue manager can view curator notes
        if request and request.user and request.user.is_authenticated:
            if request.user.is_staff or request.user.role == 'admin':
                return obj.curator_notes
            if obj.venue and obj.venue.members.filter(user=request.user).exists():
                return obj.curator_notes
        return ''


class MingleProposalSerializer(serializers.ModelSerializer):
    """Serializer for venue managers to submit Mingle event proposals."""

    venue_id = serializers.UUIDField(write_only=True)
    hero_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Mingle
        fields = [
            'id',
            'venue_id',
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
        ]
        read_only_fields = ['id', 'status', 'curator_notes', 'created_at']

    def validate_event_date(self, value):
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError("Event date cannot be in the past.")
        return value

    def validate(self, attrs):
        age_min = attrs.get('age_min', 18)
        age_max = attrs.get('age_max', 99)
        if age_min < 18:
            raise serializers.ValidationError({"age_min": "Minimum attendee age must be at least 18."})
        if age_max < age_min:
            raise serializers.ValidationError({"age_max": "Maximum age cannot be less than minimum age."})
        return attrs

