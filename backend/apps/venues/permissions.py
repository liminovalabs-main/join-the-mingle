"""Custom permission classes for the Venues domain."""
from rest_framework import permissions

from apps.venues.models import Venue, VenueMember


class IsEmailVerified(permissions.BasePermission):
    """Allow access only to authenticated users with verified email addresses."""

    message = 'Email verification is required to perform this action. Please verify your email first.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, 'is_email_verified', False)
                or request.user.role == 'admin'
                or request.user.is_staff
            )
        )


class IsAssignedVenueManager(permissions.BasePermission):
    """Allow access only to members assigned as staff/manager for the specific venue or platform admins."""

    message = 'You do not have management permissions for this venue.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('venue_manager', 'admin')
                or request.user.venue_memberships.exists()
            )
        )

    def has_object_permission(self, request, view, obj) -> bool:
        if request.user.role == 'admin':
            return True

        if isinstance(obj, Venue):
            return VenueMember.objects.filter(venue=obj, user=request.user).exists()

        venue = getattr(obj, 'venue', None)
        if venue:
            return VenueMember.objects.filter(venue=venue, user=request.user).exists()

        return False
