from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.interactions.models import Connection, Feedback, MingleSelection, VenueReview
from apps.users.serializers import PublicProfileSerializer


class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for submitting post-mingle experience feedback."""

    author_name = serializers.CharField(source='author.display_name', read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id',
            'overall_rating',
            'comment',
            'author_name',
            'created_at',
        ]
        read_only_fields = ['id', 'author_name', 'created_at']

    def validate_overall_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value


class VenueReviewSerializer(serializers.ModelSerializer):
    """Serializer for submitting direct venue reviews (Fixes Base44 Defect #7)."""

    author_name = serializers.CharField(source='author.display_name', read_only=True)

    class Meta:
        model = VenueReview
        fields = [
            'id',
            'rating',
            'comment',
            'author_name',
            'created_at',
        ]
        read_only_fields = ['id', 'author_name', 'created_at']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value


class MingleSelectionSerializer(serializers.Serializer):
    """Accepts list of target attendee profile UUIDs selected by a member."""

    target_profile_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text='List of profile UUIDs of attendees you would like to connect with.',
    )


class ConnectionSerializer(serializers.ModelSerializer):
    """Serializer for confirmed mutual matches, exposing only sanitized public profiles."""

    matched_profile = serializers.SerializerMethodField()
    mingle_title = serializers.CharField(source='mingle.title', read_only=True)
    mingle_date = serializers.DateField(source='mingle.event_date', read_only=True)

    class Meta:
        model = Connection
        fields = [
            'id',
            'mingle_id',
            'mingle_title',
            'mingle_date',
            'matched_profile',
            'is_celebrated',
            'created_at',
        ]
        read_only_fields = fields

    @extend_schema_field(PublicProfileSerializer)
    def get_matched_profile(self, obj: Connection):
        request = self.context.get('request')
        current_profile = request.user.profile if (request and request.user and request.user.is_authenticated) else None

        # Return the OTHER party in the connection
        if current_profile and obj.profile_a_id == current_profile.id:
            other_profile = obj.profile_b
        else:
            other_profile = obj.profile_a

        return PublicProfileSerializer(other_profile, context=self.context).data
