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


from django.http import HttpResponse
from apps.notifications.calendar import CalendarService


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


class BookingCalendarView(APIView):
    """Download RFC 5545 standard .ics calendar invitation for a booking."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Bookings'],
        summary='Download iCalendar (.ics) file',
        description='Generate and download RFC 5545 compliant .ics file for a confirmed booking.',
        responses={
            200: {'type': 'string', 'format': 'binary'},
            403: {'type': 'object'},
            404: {'type': 'object'},
        },
    )
    def get(self, request, id):
        booking = get_object_or_404(
            Booking.objects.select_related('mingle__venue', 'profile__user'),
            id=id,
        )
        if booking.profile.user != request.user and request.user.role != 'admin':
            return Response(
                {'success': False, 'error': {'message': "You do not have permission to access this booking calendar."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        ics_content = CalendarService.generate_ics(booking)
        response = HttpResponse(ics_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="mingle-booking-{booking.id.hex[:8]}.ics"'
        return response
