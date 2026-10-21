"""Views for the Bookings domain."""
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.bookings.serializers import (
    BookingCancelSerializer,
    BookingDetailSerializer,
    CreateBookingSerializer,
)
from apps.bookings.services import BookingService
from apps.core.pagination import StandardResultsPagination


class BookingCreateView(generics.CreateAPIView):
    """Reserve 1 to 5 seats for an upcoming Mingle with concurrency-safe locking."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateBookingSerializer

    @extend_schema(
        request=CreateBookingSerializer,
        responses={201: BookingDetailSerializer},
        description="Reserve places for a Mingle. Fixes overbooking and past-event booking.",
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = request.user.profile
        booking = serializer.save(profile=profile)

        response_data = BookingDetailSerializer(booking, context={'request': request}).data
        return Response(
            {
                'success': True,
                'message': 'Reservation created successfully. Pending payment.',
                'booking': response_data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyBookingsListView(generics.ListAPIView):
    """List all reservations made by the authenticated member."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingDetailSerializer
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'mingle__event_date']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        return (
            Booking.objects.filter(profile=self.request.user.profile)
            .select_related('mingle', 'mingle__venue')
            .order_by('-created_at')
        )


class BookingDetailView(generics.RetrieveAPIView):
    """Retrieve details of a specific reservation."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        if self.request.user.role == 'admin':
            return Booking.objects.all().select_related('mingle', 'mingle__venue')
        return (
            Booking.objects.filter(profile=self.request.user.profile)
            .select_related('mingle', 'mingle__venue')
        )


class BookingCancelView(APIView):
    """Cancel an upcoming reservation and release reserved capacity."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingCancelSerializer

    @extend_schema(
        request=BookingCancelSerializer,
        responses={200: BookingDetailSerializer},
        description="Cancel a reservation before event start and release seats.",
    )
    def post(self, request, id):
        serializer = BookingCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking = get_object_or_404(Booking, id=id)
        cancelled_booking = BookingService.cancel_booking(booking=booking, profile=request.user.profile)

        response_data = BookingDetailSerializer(cancelled_booking, context={'request': request}).data
        return Response(
            {
                'success': True,
                'message': 'Booking cancelled successfully. Capacity released.',
                'booking': response_data,
            },
            status=status.HTTP_200_OK,
        )
