from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsPagination
from apps.mingles.filters import MingleFilter
from apps.mingles.models import Mingle
from apps.mingles.serializers import (
    MingleDetailSerializer,
    MingleListSerializer,
    MingleProposalSerializer,
)
from apps.mingles.services import MingleProposalService
from apps.users.models import Profile
from apps.users.serializers import PublicProfileSerializer
from apps.venues.models import Venue
from apps.venues.permissions import IsAssignedVenueManager



class MingleListView(generics.ListAPIView):
    """Browse live published Mingle events in London with rich multi-parameter filtering."""

    permission_classes = [permissions.AllowAny]
    serializer_class = MingleListSerializer
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MingleFilter
    search_fields = ['title', 'description', 'venue__name', 'venue__area']
    ordering_fields = ['event_date', 'start_time', 'ticket_price', 'created_at']
    ordering = ['event_date', 'start_time']

    def get_queryset(self):
        # Default to upcoming published events
        return (
            Mingle.objects.filter(status='published', event_date__gte=timezone.now().date())
            .select_related('venue')
            .prefetch_related('bookings')
        )


class MingleDetailView(generics.RetrieveAPIView):
    """Retrieve full details of a specific Mingle event including remaining spots."""

    permission_classes = [permissions.AllowAny]
    serializer_class = MingleDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return (
            Mingle.objects.filter(status='published')
            .select_related('venue')
            .prefetch_related('bookings')
        )


class MingleAttendeesView(APIView):
    """Dynamic 'Who's Going' attendee roster (Base44 Defect #5 Fix).

    Fetches the live list of confirmed attendees dynamically from confirmed
    booking records, rendered with UK GDPR PublicProfileSerializer
    (strictly stripping date_of_birth and email).
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        responses={200: PublicProfileSerializer(many=True)},
        description="Returns list of confirmed attendee profiles for this Mingle (UK GDPR sanitized).",
    )
    def get(self, request, id):
        mingle = get_object_or_404(Mingle, id=id, status='published')

        attendee_profiles = (
            Profile.objects.filter(
                bookings__mingle=mingle,
                bookings__status='confirmed',
            )
            .distinct()
            .order_by('display_name')
        )

        serializer = PublicProfileSerializer(attendee_profiles, many=True)
        return Response(
            {
                'success': True,
                'mingle_id': str(mingle.id),
                'mingle_title': mingle.title,
                'attendees_count': attendee_profiles.count(),
                'attendees': serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MingleProposalCreateView(APIView):
    """Submit a Mingle experience proposal for founder review."""

    permission_classes = [permissions.IsAuthenticated, IsAssignedVenueManager]

    @extend_schema(
        tags=['Mingles'],
        summary='Submit a Mingle Proposal',
        description='Allows an assigned venue manager to submit an experience proposal for their approved venue.',
        request=MingleProposalSerializer,
        responses={
            201: MingleProposalSerializer,
            400: OpenApiResponse(description='Validation error or past-date.'),
            403: OpenApiResponse(description='Permission denied or venue unapproved.'),
        },
    )
    def post(self, request):
        serializer = MingleProposalSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            mingle = MingleProposalService.submit_proposal(
                user=request.user,
                validated_data=serializer.validated_data,
            )
            return Response(
                MingleProposalSerializer(mingle, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {'success': False, 'error': {'message': str(e.message if hasattr(e, 'message') else e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionDenied as e:
            return Response(
                {'success': False, 'error': {'message': str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )


class VenueMingleListView(generics.ListAPIView):
    """List all mingles for a specific venue (for venue manager dashboard)."""

    permission_classes = [permissions.IsAuthenticated, IsAssignedVenueManager]
    serializer_class = MingleDetailSerializer
    pagination_class = StandardResultsPagination

    queryset = Mingle.objects.none()

    @extend_schema(
        tags=['Mingles'],
        summary='List Venue Mingles',
        description='Returns all mingles (draft, submitted, published, completed) for a venue.',
        responses={200: MingleDetailSerializer(many=True)},
    )
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Mingle.objects.none()
        venue_id = self.kwargs.get('venue_id')
        venue = get_object_or_404(Venue, id=venue_id)
        self.check_object_permissions(self.request, venue)
        return (
            Mingle.objects.filter(venue=venue)
            .select_related('venue')
            .prefetch_related('bookings')
            .order_by('-event_date', '-start_time')
        )

