"""Django admin configuration for Interaction models."""
from django.contrib import admin

from apps.interactions.models import Connection, Feedback, MingleSelection, VenueReview


@admin.register(MingleSelection)
class MingleSelectionAdmin(admin.ModelAdmin):
    list_display = ('selector', 'target', 'mingle', 'created_at')
    list_filter = ('mingle',)


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ('profile_a', 'profile_b', 'mingle', 'is_celebrated', 'created_at')
    list_filter = ('is_celebrated',)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('author', 'mingle', 'overall_rating', 'created_at')
    list_filter = ('overall_rating',)


@admin.register(VenueReview)
class VenueReviewAdmin(admin.ModelAdmin):
    list_display = ('author', 'venue', 'rating', 'created_at')
    list_filter = ('rating',)
