"""Custom DRF permission classes for role-based access control (RBAC).

These permissions enforce the Mingler platform's three-tier role system:
- Member: Standard authenticated user.
- Venue Manager: Can manage venue profiles and submit mingles.
- Platform Admin: Full administrative access.
"""
from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Allow access only to users with the 'admin' role."""

    message = 'Platform administrator access required.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsVenueManager(permissions.BasePermission):
    """Allow access to venue managers and platform admins."""

    message = 'Venue manager or administrator access required.'

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('venue_manager', 'admin')
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow object access only to the owner or platform admins.

    The object must have a 'user' attribute pointing to the owning user.
    """

    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj) -> bool:
        if request.user.role == 'admin':
            return True
        return getattr(obj, 'user', None) == request.user


class IsReadOnly(permissions.BasePermission):
    """Allow read-only access for any request."""

    def has_permission(self, request, view) -> bool:
        return request.method in permissions.SAFE_METHODS
