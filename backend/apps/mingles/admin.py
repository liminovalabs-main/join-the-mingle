"""Django admin configuration for Mingle models."""
from django.contrib import admin

from apps.mingles.models import Mingle


@admin.register(Mingle)
class MingleAdmin(admin.ModelAdmin):
    list_display = ('title', 'venue', 'experience_type', 'event_date', 'ticket_price', 'capacity', 'status')
    list_filter = ('status', 'experience_type', 'event_date')
    search_fields = ('title', 'venue__name')
    date_hierarchy = 'event_date'
