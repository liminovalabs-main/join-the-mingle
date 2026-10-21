"""Django admin configuration for Administration models."""
from django.contrib import admin

from apps.administration.models import PlatformSetting


@admin.register(PlatformSetting)
class PlatformSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_by', 'created_at')
    list_filter = ('key',)
    search_fields = ('key',)
    readonly_fields = ('created_at', 'updated_at')
