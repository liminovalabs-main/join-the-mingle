"""Django admin configuration for User and Profile models."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.users.models import EmailVerificationCode, PasswordResetCode, Profile, SocialAccount, User


class ProfileInline(admin.StackedInline):
    """Inline profile editor within the User admin page."""

    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'


class SocialAccountInline(admin.TabularInline):
    """Inline view of connected social accounts."""

    model = SocialAccount
    extra = 0
    readonly_fields = ('provider', 'uid', 'created_at', 'updated_at')
    can_delete = True


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin view for the custom User model."""

    inlines = (ProfileInline, SocialAccountInline)
    list_display = ('email', 'role', 'is_active', 'is_email_verified', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_email_verified', 'is_staff')
    search_fields = ('email',)
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_email_verified', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_active', 'is_email_verified'),
        }),
    )


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    """Admin view for inspecting email verification OTP codes."""

    list_display = ('user', 'code', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'code')
    readonly_fields = ('created_at',)


@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    """Admin view for inspecting password reset OTP codes."""

    list_display = ('user', 'code', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'code')
    readonly_fields = ('created_at',)


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    """Admin view for managing linked social OAuth2 accounts."""

    list_display = ('user', 'provider', 'uid', 'created_at', 'updated_at')
    list_filter = ('provider', 'created_at')
    search_fields = ('user__email', 'uid')
    readonly_fields = ('created_at', 'updated_at')

