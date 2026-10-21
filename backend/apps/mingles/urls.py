from django.urls import path
from apps.interactions.views import MingleFeedbackCreateView, MingleSelectionCreateView
from apps.mingles.views import (
    MingleAttendeesView,
    MingleDetailView,
    MingleListView,
    MingleProposalCreateView,
)

urlpatterns = [
    path('submit/', MingleProposalCreateView.as_view(), name='mingle-submit'),
    path('', MingleListView.as_view(), name='mingle-list'),
    path('<uuid:id>/', MingleDetailView.as_view(), name='mingle-detail'),
    path('<uuid:id>/attendees/', MingleAttendeesView.as_view(), name='mingle-attendees'),
    path('<uuid:id>/feedback/', MingleFeedbackCreateView.as_view(), name='mingle-feedback'),
    path('<uuid:id>/select/', MingleSelectionCreateView.as_view(), name='mingle-select'),
]
