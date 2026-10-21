"""Views for platform administration, founder approvals, and settings management."""
from decimal import Decimal
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administration.models import PlatformSetting
from apps.administration.serializers import (
    CommissionSettingUpdateSerializer,
    MingleApprovalActionSerializer,
    MingleApprovalQueueSerializer,
    PlatformSettingSerializer,
    VenueApprovalActionSerializer,
    VenueApprovalQueueSerializer,
)
from apps.administration.services import ApprovalService, PlatformSettingService
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsPlatformAdmin
from apps.mingles.models import Mingle
from apps.venues.models import Venue


class PendingVenueListView(generics.ListAPIView):
    """List all pending venue registrations awaiting founder approval."""

    permission_classes = [IsPlatformAdmin]
    serializer_class = VenueApprovalQueueSerializer
    pagination_class = StandardResultsPagination

    @extend_schema(
        tags=['Administration'],
        summary='List Pending Venues for Approval',
        description='Founder approval queue: returns all venues currently awaiting verification.',
        responses={200: VenueApprovalQueueSerializer(many=True)},
    )
    def get_queryset(self):
        return (
            Venue.objects.filter(status='pending')
            .prefetch_related('members__user__profile')
            .order_by('-created_at')
        )


class VenueApprovalActionView(APIView):
    """Approve or reject a pending venue registration."""

    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        tags=['Administration'],
        summary='Decide on Pending Venue Registration',
        description='Allows a platform founder to approve (publishes live) or reject a venue application.',
        request=VenueApprovalActionSerializer,
        responses={
            200: VenueApprovalQueueSerializer,
            400: OpenApiResponse(description='Invalid action or validation error.'),
            404: OpenApiResponse(description='Venue not found.'),
        },
    )
    def post(self, request, id):
        venue = generics.get_object_or_404(Venue, id=id)
        serializer = VenueApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        updated_venue = ApprovalService.decide_venue(
            venue=venue,
            action=action,
            admin_user=request.user,
        )
        return Response(
            VenueApprovalQueueSerializer(updated_venue).data,
            status=status.HTTP_200_OK,
        )


class PendingMingleListView(generics.ListAPIView):
    """List all submitted Mingle proposals awaiting founder review."""

    permission_classes = [IsPlatformAdmin]
    serializer_class = MingleApprovalQueueSerializer
    pagination_class = StandardResultsPagination

    @extend_schema(
        tags=['Administration'],
        summary='List Mingle Proposals for Approval',
        description='Founder approval queue: returns all Mingle experiences submitted by venues.',
        responses={200: MingleApprovalQueueSerializer(many=True)},
    )
    def get_queryset(self):
        return (
            Mingle.objects.filter(status__in=['submitted', 'changes_requested'])
            .select_related('venue')
            .order_by('-created_at')
        )


class MingleApprovalActionView(APIView):
    """Approve, request changes, or reject a submitted Mingle proposal."""

    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        tags=['Administration'],
        summary='Decide on Mingle Experience Proposal',
        description='Allows a founder to approve/publish, request modifications, or reject a Mingle.',
        request=MingleApprovalActionSerializer,
        responses={
            200: MingleApprovalQueueSerializer,
            400: OpenApiResponse(description='Invalid action or validation error.'),
            404: OpenApiResponse(description='Mingle not found.'),
        },
    )
    def post(self, request, id):
        mingle = generics.get_object_or_404(Mingle, id=id)
        serializer = MingleApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        curator_notes = serializer.validated_data.get('curator_notes', '')

        updated_mingle = ApprovalService.decide_mingle(
            mingle=mingle,
            action=action,
            curator_notes=curator_notes,
            admin_user=request.user,
        )
        return Response(
            MingleApprovalQueueSerializer(updated_mingle).data,
            status=status.HTTP_200_OK,
        )


class PlatformCommissionSettingView(APIView):
    """Retrieve and dynamically update the platform commission fee."""

    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        tags=['Administration'],
        summary='Get Platform Commission Settings',
        description='Returns current commission rate along with recent audit change logs.',
        responses={200: OpenApiResponse(description='Commission rate and history.')},
    )
    def get(self, request):
        current_rate = PlatformSettingService.get_setting(
            key=PlatformSettingService.COMMISSION_KEY,
            default=PlatformSettingService.DEFAULT_COMMISSION,
        )
        recent_history = PlatformSetting.objects.filter(
            key=PlatformSettingService.COMMISSION_KEY
        ).order_by('-created_at')[:10]

        return Response(
            {
                'success': True,
                'commission_rate': float(current_rate) if current_rate else 10.0,
                'history': PlatformSettingSerializer(recent_history, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=['Administration'],
        summary='Update Platform Commission Rate',
        description='Updates the platform commission percentage with an immutable audit log.',
        request=CommissionSettingUpdateSerializer,
        responses={200: PlatformSettingSerializer},
    )
    def patch(self, request):
        serializer = CommissionSettingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rate = serializer.validated_data['commission_rate']
        notes = serializer.validated_data.get('notes', '')

        setting = PlatformSettingService.set_setting(
            key=PlatformSettingService.COMMISSION_KEY,
            value=float(rate),
            user=request.user,
            notes=notes,
        )
        return Response(
            {
                'success': True,
                'message': f"Platform commission updated to {rate}%",
                'setting': PlatformSettingSerializer(setting).data,
            },
            status=status.HTTP_200_OK,
        )
