"""Django admin configuration for Venue models."""
from django.contrib import admin

from apps.venues.models import Venue, VenueMember, VenueOpeningHour


class VenueOpeningHourInline(admin.TabularInline):
    model = VenueOpeningHour
    extra = 0


class VenueMemberInline(admin.TabularInline):
    model = VenueMember
    extra = 0


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'area', 'status', 'commission_rate', 'created_at')
    list_filter = ('status', 'category', 'area')
    search_fields = ('name', 'area', 'postcode')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VenueOpeningHourInline, VenueMemberInline]
