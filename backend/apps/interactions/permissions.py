"""Custom permissions for interactions, post-mingle feedback, and mutual matching."""
from rest_framework import permissions
from apps.bookings.models import Booking
from apps.mingles.models import Mingle


class HasConfirmedAttendance(permissions.BasePermission):
    """Allows access only to members who hold a confirmed booking for the target Mingle.

    Fixes Base44 Defect #4 (unauthorized reviews from non-attendees).
    """

    message = "Only confirmed attendees can submit reviews, feedback, or selections for this Mingle."

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        # In Swagger/OpenAPI schema generation, bypass database lookup
        if getattr(view, 'swagger_fake_view', False):
            return True

        mingle_id = view.kwargs.get('id') or view.kwargs.get('mingle_id')
        if not mingle_id:
            return True

        return Booking.objects.filter(
            mingle_id=mingle_id,
            profile__user=request.user,
            status='confirmed',
        ).exists()

    def has_object_permission(self, request, view, obj) -> bool:
        if getattr(view, 'swagger_fake_view', False):
            return True

        mingle = obj if isinstance(obj, Mingle) else getattr(obj, 'mingle', None)
        if not mingle:
            return False

        return Booking.objects.filter(
            mingle=mingle,
            profile__user=request.user,
            status='confirmed',
        ).exists()
