"""Views for the Venues domain."""
import logging
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardResultsPagination
from apps.venues.filters import VenueFilter
from apps.venues.models import Venue
from apps.venues.permissions import IsAssignedVenueManager, IsEmailVerified
from apps.venues.serializers import (
    MyVenueListSerializer,
    VenueDetailSerializer,
    VenueListSerializer,
    VenueOpeningHourInputSerializer,
    VenueOpeningHourSerializer,
    VenueRegistrationSerializer,
    VenueUpdateSerializer,
)
from apps.venues.services import VenueService

logger = logging.getLogger(__name__)


class VenueListView(generics.ListAPIView):
    """List approved London venues with filtering by area, category, and search."""

    permission_classes = [permissions.AllowAny]
    serializer_class = VenueListSerializer
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VenueFilter
    search_fields = ['name', 'area', 'postcode', 'category']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        return Venue.objects.filter(status='approved').prefetch_related('reviews')


class VenueDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve detailed profile of a venue (public) or update it (assigned manager / admin)."""

    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAssignedVenueManager()]

    def get_serializer_class(self):
        if self.request.method in permissions.SAFE_METHODS:
            return VenueDetailSerializer
        return VenueUpdateSerializer

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return Venue.objects.filter(status='approved').prefetch_related('opening_hours', 'reviews')
        return Venue.objects.all().prefetch_related('opening_hours', 'reviews')

    def get_object(self):
        lookup_val = self.kwargs.get(self.lookup_field)
        queryset = self.get_queryset()

        import uuid
        try:
            val_uuid = uuid.UUID(str(lookup_val))
            obj = generics.get_object_or_404(queryset, id=val_uuid)
        except (ValueError, TypeError):
            obj = generics.get_object_or_404(queryset, slug=lookup_val)

        self.check_object_permissions(self.request, obj)
        return obj



class VenueRegisterView(APIView):
    """Self-service venue registration for email-verified users."""

    permission_classes = [permissions.IsAuthenticated, IsEmailVerified]

    @extend_schema(
        tags=['Venues'],
        summary='Register a New Venue (Awaiting Founder Approval)',
        description=(
            'Allows an email-verified member to register a venue application. '
            'Creates a Venue with status="pending", assigns caller as manager, '
            'and updates their account role to "venue_manager".'
        ),
        request=VenueRegistrationSerializer,
        responses={
            201: VenueRegistrationSerializer,
            400: OpenApiResponse(description='Validation error or duplicate name.'),
            403: OpenApiResponse(description='Email verification required.'),
        },
    )
    def post(self, request):
        serializer = VenueRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        venue = VenueService.register_venue(
            user=request.user,
            validated_data=serializer.validated_data,
        )
        return Response(
            VenueRegistrationSerializer(venue).data,
            status=status.HTTP_201_CREATED,
        )


class MyVenuesListView(generics.ListAPIView):
    """List all venues managed by the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MyVenueListSerializer
    pagination_class = StandardResultsPagination

    queryset = Venue.objects.none()

    @extend_schema(
        tags=['Venues'],
        summary='List My Managed Venues',
        description='Returns all venues where the authenticated user is an assigned manager or staff member.',
        responses={200: MyVenueListSerializer(many=True)},
    )
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Venue.objects.none()
        if getattr(self.request.user, 'role', None) == 'admin':
            return Venue.objects.all().prefetch_related('members', 'reviews').order_by('-created_at')
        return (
            Venue.objects.filter(members__user=self.request.user)
            .distinct()
            .prefetch_related('members', 'reviews')
            .order_by('-created_at')
        )


class VenueUpdateView(generics.UpdateAPIView):
    """Update profile and details of a managed venue."""

    permission_classes = [permissions.IsAuthenticated, IsAssignedVenueManager]
    serializer_class = VenueUpdateSerializer
    queryset = Venue.objects.all()
    lookup_field = 'id'

    @extend_schema(
        tags=['Venues'],
        summary='Update Managed Venue Profile',
        description='Allows the assigned venue manager or platform admin to update venue information.',
        request=VenueUpdateSerializer,
        responses={200: VenueDetailSerializer},
    )
    def perform_update(self, serializer):
        venue = serializer.save()
        logger.info("Venue %s updated by %s", venue.name, self.request.user.email)


class VenueOpeningHoursUpdateView(APIView):
    """Configure or bulk replace the 7-day operating schedule for a venue."""

    permission_classes = [permissions.IsAuthenticated, IsAssignedVenueManager]

    @extend_schema(
        tags=['Venues'],
        summary='Configure Venue Operating Hours',
        description='Configures or replaces the opening hours schedule for each day of the week.',
        request=VenueOpeningHourInputSerializer(many=True),
        responses={200: VenueOpeningHourSerializer(many=True)},
    )
    def put(self, request, id):
        venue = generics.get_object_or_404(Venue, id=id)
        self.check_object_permissions(request, venue)

        serializer = VenueOpeningHourInputSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        updated_hours = VenueService.update_opening_hours(
            venue=venue,
            hours_data=serializer.validated_data,
        )
        return Response(
            VenueOpeningHourSerializer(updated_hours, many=True).data,
            status=status.HTTP_200_OK,
        )
