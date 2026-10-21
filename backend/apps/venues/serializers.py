"""Serializers for the Venues domain."""
from typing import Any, Dict
from django.db.models import Avg
from django.utils.text import slugify
from rest_framework import serializers

from apps.venues.models import Venue, VenueMember, VenueOpeningHour


class VenueOpeningHourSerializer(serializers.ModelSerializer):
    """Opening hours serializer for a specific day of the week."""

    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = VenueOpeningHour
        fields = ['id', 'day_of_week', 'day_name', 'open_time', 'close_time', 'is_closed']


class VenueOpeningHourInputSerializer(serializers.Serializer):
    """Input serializer for configuring/updating venue opening hours."""

    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    open_time = serializers.TimeField(required=False, allow_null=True)
    close_time = serializers.TimeField(required=False, allow_null=True)
    is_closed = serializers.BooleanField(default=False)

    def validate(self, attrs):
        is_closed = attrs.get('is_closed', False)
        open_time = attrs.get('open_time')
        close_time = attrs.get('close_time')

        if not is_closed and (not open_time or not close_time):
            raise serializers.ValidationError(
                "open_time and close_time are required when is_closed is False."
            )
        return attrs


class VenueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for venue directory listing and filtering."""

    hero_image = serializers.ImageField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
            'hero_image',
            'status',
            'average_rating',
            'review_count',
            'created_at',
        ]

    def get_average_rating(self, obj: Venue) -> float:
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(avg), 1) if avg else 5.0

    def get_review_count(self, obj: Venue) -> int:
        return obj.reviews.count()


class VenueDetailSerializer(serializers.ModelSerializer):
    """Detailed venue profile with opening hours, upcoming mingles, and verified reviews."""

    hero_image = serializers.ImageField(read_only=True)
    opening_hours = VenueOpeningHourSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
            'average_rating',
            'review_count',
            'opening_hours',
            'created_at',
            'updated_at',
        ]

    def get_average_rating(self, obj: Venue) -> float:
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(avg), 1) if avg else 5.0

    def get_review_count(self, obj: Venue) -> int:
        return obj.reviews.count()


class VenueRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for self-service venue registration by verified users."""

    hero_image = serializers.ImageField(required=False, allow_null=True)

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
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'status', 'created_at']

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Venue name cannot be blank.")
        candidate_slug = slugify(value)
        if Venue.objects.filter(slug=candidate_slug).exists():
            raise serializers.ValidationError(
                f"A venue with a similar name '{value}' already exists. Please choose a distinctive name."
            )
        return value


class VenueUpdateSerializer(serializers.ModelSerializer):
    """Serializer for venue managers or admins to update venue profile details."""

    hero_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Venue
        fields = [
            'name',
            'category',
            'area',
            'address',
            'postcode',
            'description',
            'hero_image',
        ]


class MyVenueListSerializer(serializers.ModelSerializer):
    """Serializer for venues managed by the authenticated user."""

    role = serializers.SerializerMethodField()
    hero_image = serializers.ImageField(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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
            'hero_image',
            'status',
            'role',
            'commission_rate',
            'average_rating',
            'review_count',
            'created_at',
            'updated_at',
        ]

    def get_role(self, obj: Venue) -> str:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'member'
        if request.user.role == 'admin':
            return 'admin'
        membership = obj.members.filter(user=request.user).first()
        return membership.role if membership else 'staff'

    def get_average_rating(self, obj: Venue) -> float:
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(avg), 1) if avg else 5.0

    def get_review_count(self, obj: Venue) -> int:
        return obj.reviews.count()


class VenueMemberSerializer(serializers.ModelSerializer):
    """Serializer for venue staff memberships."""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    display_name = serializers.CharField(source='user.profile.display_name', read_only=True)

    class Meta:
        model = VenueMember
        fields = ['id', 'user', 'user_email', 'display_name', 'role', 'created_at']
