"""User and Profile models for the Mingler platform.

User model uses email as the primary authentication identifier.
Profile model stores all member-facing data including UK GDPR
protected fields (date_of_birth) that must never be exposed publicly.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models

from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email-based authentication and role-based access.

    Roles:
        - member: Standard platform user who can browse and book mingles.
        - venue_manager: Can manage venue profiles and submit mingle proposals.
        - admin: Platform administrator with full access.
    """

    ROLE_CHOICES = (
        ('member', 'Member'),
        ('venue_manager', 'Venue Manager'),
        ('admin', 'Platform Admin'),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text='Primary login identifier. Must be unique.',
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='member',
        db_index=True,
    )
    is_active = models.BooleanField(
        default=False,
        help_text='Designates whether this user account is active. Activated upon email verification.',
    )
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(
        default=False,
        help_text='Designates whether this user has verified their email address.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.email


class Profile(models.Model):
    """Member profile containing personal and social information.

    UK GDPR Note:
        The `date_of_birth` field is classified as personal data under
        UK GDPR. It must NEVER be included in public-facing API responses.
        Use `PublicProfileSerializer` for any attendee list or public endpoint.
    """

    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Prefer not to say', 'Prefer not to say'),
    )
    RELATIONSHIP_CHOICES = (
        ('Single', 'Single'),
        ('Married', 'Married'),
        ("It's complicated", "It's complicated"),
    )

    instagram_validator = RegexValidator(
        regex=r'^[a-zA-Z0-9._]{1,30}$',
        message='Enter a valid Instagram handle (letters, numbers, dots, underscores only).',
    )
    linkedin_validator = RegexValidator(
        regex=r'^https?://(www\.)?linkedin\.com/in/[\w-]+/?$',
        message='Enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-name).',
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    display_name = models.CharField(max_length=100)
    photo = models.ImageField(
        upload_to='profiles/',
        max_length=500,
        blank=True,
        null=True,
        help_text='Member avatar image file.',
    )
    gender = models.CharField(
        max_length=25,
        choices=GENDER_CHOICES,
        blank=True,
    )
    relationship_status = models.CharField(
        max_length=25,
        choices=RELATIONSHIP_CHOICES,
        blank=True,
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text='UK GDPR Private — Never exposed publicly.',
    )
    is_age_verified = models.BooleanField(default=False)
    bio = models.TextField(blank=True)
    interests = models.JSONField(
        default=list,
        blank=True,
        help_text='List of interest tags, e.g. ["Wine Tasting", "Jazz"].',
    )
    instagram_handle = models.CharField(
        max_length=50,
        blank=True,
        validators=[instagram_validator],
    )
    linkedin_url = models.URLField(
        max_length=200,
        blank=True,
        validators=[linkedin_validator],
    )
    sound_enabled = models.BooleanField(default=True)
    notifications_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'

    def __str__(self) -> str:
        return f'{self.display_name} ({self.user.email})'


class EmailVerificationCode(models.Model):
    """Stores 6-digit email verification OTP codes with 15-minute expiration."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='verification_codes',
    )
    code = models.CharField(max_length=6, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'email_verification_codes'
        verbose_name = 'Email Verification Code'
        verbose_name_plural = 'Email Verification Codes'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.user.email} — {self.code}'

    def is_valid(self) -> bool:
        """Check if code is unused and not expired."""
        from django.utils import timezone
        return not self.is_used and timezone.now() <= self.expires_at

    @classmethod
    def generate_code_for_user(cls, user: User) -> str:
        """Invalidate old codes and generate a new 6-digit verification code."""
        import random
        from datetime import timedelta
        from django.utils import timezone

        # Invalidate existing unused codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        code = f'{random.randint(100000, 999999)}'
        expires_at = timezone.now() + timedelta(minutes=15)
        cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
        )
        return code


class PasswordResetCode(models.Model):
    """Stores 6-digit password reset OTP codes with 15-minute expiration."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_codes',
    )
    code = models.CharField(max_length=6, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_codes'
        verbose_name = 'Password Reset Code'
        verbose_name_plural = 'Password Reset Codes'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.user.email} (Reset) — {self.code}'

    def is_valid(self) -> bool:
        """Check if reset code is unused and not expired."""
        from django.utils import timezone
        return not self.is_used and timezone.now() <= self.expires_at

    @classmethod
    def generate_code_for_user(cls, user: User) -> str:
        """Invalidate old reset codes and generate a new 6-digit reset code."""
        import random
        from datetime import timedelta
        from django.utils import timezone

        # Invalidate existing unused password reset codes
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        code = f'{random.randint(100000, 999999)}'
        expires_at = timezone.now() + timedelta(minutes=15)
        cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at,
        )
        return code


class SocialAccount(models.Model):
    """Links a Member User with an external OAuth2 social provider account.

    Supported Providers:
        - google
        - apple
        - facebook
        - instagram
        - tiktok
        - linkedin
    """

    PROVIDER_CHOICES = (
        ('google', 'Google'),
        ('apple', 'Apple'),
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('linkedin', 'LinkedIn'),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='social_accounts',
    )
    provider = models.CharField(
        max_length=30,
        choices=PROVIDER_CHOICES,
        db_index=True,
    )
    uid = models.CharField(
        max_length=255,
        db_index=True,
        help_text='Unique identifier from the OAuth2 provider (e.g. sub or id).',
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='Cached provider profile metadata.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_accounts'
        verbose_name = 'Social Account'
        verbose_name_plural = 'Social Accounts'
        unique_together = ('provider', 'uid')
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.user.email} - {self.get_provider_display()} ({self.uid})'

