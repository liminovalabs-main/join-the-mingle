"""Administration URL patterns."""
from django.urls import path

from apps.administration.views import (
    MingleApprovalActionView,
    PendingMingleListView,
    PendingVenueListView,
    PlatformCommissionSettingView,
    VenueApprovalActionView,
)

urlpatterns = [
    # Founder Approvals Queue — Venues
    path('approvals/venues/', PendingVenueListView.as_view(), name='admin-approvals-venues-list'),
    path('approvals/venues/<uuid:id>/', VenueApprovalActionView.as_view(), name='admin-approvals-venues-action'),

    # Founder Approvals Queue — Mingles
    path('approvals/mingles/', PendingMingleListView.as_view(), name='admin-approvals-mingles-list'),
    path('approvals/mingles/<uuid:id>/', MingleApprovalActionView.as_view(), name='admin-approvals-mingles-action'),

    # Platform Settings & Commission Rates
    path('platform-settings/', PlatformCommissionSettingView.as_view(), name='admin-platform-settings'),
    path('platform-settings/commission/', PlatformCommissionSettingView.as_view(), name='admin-platform-commission'),
]
