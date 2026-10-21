"""Views for post-mingle feedback, venue reviews, attendee selections, and connections."""
from django.db.models import Q
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.interactions.models import Connection, Feedback, VenueReview
from apps.interactions.permissions import HasConfirmedAttendance
from apps.interactions.serializers import (
    ConnectionSerializer,
    FeedbackSerializer,
    MingleSelectionSerializer,
    VenueReviewSerializer,
)
from apps.interactions.services import MatchingService
from apps.mingles.models import Mingle
from apps.venues.models import Venue


class MingleFeedbackCreateView(APIView):
    """Submit post-mingle experience feedback.

    Attendance-gated: only confirmed attendees can submit feedback (Fixes Base44 Defect #4).
    """

    permission_classes = [permissions.IsAuthenticated, HasConfirmedAttendance]

    @extend_schema(
        tags=['Interactions'],
        summary='Submit Mingle Experience Feedback',
        description='Submits 1-5 star rating and feedback for a Mingle. Requires confirmed attendance.',
        request=FeedbackSerializer,
        responses={
            201: FeedbackSerializer,
            400: OpenApiResponse(description='Feedback already submitted or validation error.'),
            403: OpenApiResponse(description='User did not hold a confirmed ticket for this Mingle.'),
            404: OpenApiResponse(description='Mingle not found.'),
        },
    )
    def post(self, request, id):
        try:
            mingle = Mingle.objects.get(id=id)
        except Mingle.DoesNotExist:
            return Response({'error': {'message': "Mingle experience not found."}}, status=status.HTTP_404_NOT_FOUND)

        profile = request.user.profile
        if Feedback.objects.filter(mingle=mingle, author=profile).exists():
            return Response(
                {'error': {'message': "You have already submitted feedback for this experience."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(author=profile, mingle=mingle)

        return Response(
            {
                'success': True,
                'message': "Thank you! Your feedback has been recorded.",
                'feedback': FeedbackSerializer(feedback).data,
            },
            status=status.HTTP_201_CREATED,
        )


class VenueReviewCreateView(APIView):
    """Submit review for a London Venue (Fixes Base44 Defect #7 by maintaining 3NF)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Interactions'],
        summary='Submit Venue Review',
        description='Submits a 1-5 star review for a venue in London.',
        request=VenueReviewSerializer,
        responses={
            201: VenueReviewSerializer,
            400: OpenApiResponse(description='Review already submitted or validation error.'),
            404: OpenApiResponse(description='Venue not found.'),
        },
    )
    def post(self, request, slug):
        try:
            venue = Venue.objects.get(slug=slug)
        except Venue.DoesNotExist:
            try:
                venue = Venue.objects.get(id=slug)
            except (Venue.DoesNotExist, ValueError):
                return Response({'error': {'message': "Venue not found."}}, status=status.HTTP_404_NOT_FOUND)

        profile = request.user.profile
        if VenueReview.objects.filter(venue=venue, author=profile).exists():
            return Response(
                {'error': {'message': "You have already reviewed this venue."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VenueReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(author=profile, venue=venue)

        return Response(
            {
                'success': True,
                'message': "Venue review published successfully.",
                'review': VenueReviewSerializer(review).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MingleSelectionCreateView(APIView):
    """Submit attendee selections for mutual matching after a Mingle.

    Attendance-gated: only confirmed attendees can submit selections.
    """

    permission_classes = [permissions.IsAuthenticated, HasConfirmedAttendance]

    @extend_schema(
        tags=['Interactions'],
        summary='Submit Post-Mingle Attendee Selections',
        description='Submit interest selections for other attendees. When mutual, a Connection is automatically created.',
        request=MingleSelectionSerializer,
        responses={
            200: OpenApiResponse(description='Selections evaluated and mutual connections formed if matched.'),
            403: OpenApiResponse(description='User did not hold a confirmed ticket for this Mingle.'),
            404: OpenApiResponse(description='Mingle not found.'),
        },
    )
    def post(self, request, id):
        try:
            mingle = Mingle.objects.get(id=id)
        except Mingle.DoesNotExist:
            return Response({'error': {'message': "Mingle experience not found."}}, status=status.HTTP_404_NOT_FOUND)

        serializer = MingleSelectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_ids = serializer.validated_data['target_profile_ids']
        recorded, matches = MatchingService.record_selections_and_evaluate(
            mingle=mingle,
            selector_profile=request.user.profile,
            target_profile_ids=target_ids,
        )

        return Response(
            {
                'success': True,
                'message': "Selections submitted successfully.",
                'selections_recorded': recorded,
                'new_mutual_connections': matches,
            },
            status=status.HTTP_200_OK,
        )


class ConnectionListView(generics.ListAPIView):
    """List all mutual Connections formed for the authenticated member."""

    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Interactions'],
        summary='List My Mutual Connections',
        description='Retrieves all mutual Connections formed from completed Mingles.',
    )
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Connection.objects.none()

        profile = self.request.user.profile
        return Connection.objects.filter(
            Q(profile_a=profile) | Q(profile_b=profile)
        ).select_related('mingle', 'profile_a', 'profile_b').order_by('-created_at')


class ConnectionCelebrateView(APIView):
    """Mark a mutual connection as celebrated."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Interactions'],
        summary='Mark Connection Celebrated',
        description='Marks the connection celebration screen as viewed by the member.',
        request=None,
        responses={200: OpenApiResponse(description="Connection marked as celebrated.")},
    )
    def post(self, request, id):
        profile = request.user.profile
        try:
            connection = Connection.objects.get(
                Q(id=id) & (Q(profile_a=profile) | Q(profile_b=profile))
            )
        except Connection.DoesNotExist:
            return Response({'error': {'message': "Connection not found."}}, status=status.HTTP_404_NOT_FOUND)

        connection.is_celebrated = True
        connection.save(update_fields=['is_celebrated', 'updated_at'])

        return Response({'success': True, 'is_celebrated': True}, status=status.HTTP_200_OK)
