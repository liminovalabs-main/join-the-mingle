"""Serializers for authentication, user accounts, and member profiles.

Implements UK GDPR compliance by strictly segregating private profile data
(date_of_birth, email) from public-facing attendee profiles.
"""
from typing import Any, Dict

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import Profile, User


class PublicProfileSerializer(serializers.ModelSerializer):
    """Sanitized profile serializer for public attendees and mingle cards.

    UK GDPR Privacy Guard:
        This serializer is strictly stripped of any personally identifiable
        or protected data (e.g., date_of_birth, email, contact info).
        It only exposes curated public attributes needed for attendee cards.
    """

    class Meta:
        model = Profile
        fields = [
            'id',
            'display_name',
            'photo',
            'gender',
            'relationship_status',
            'bio',
            'interests',
            'instagram_handle',
            'linkedin_url',
        ]
        read_only_fields = fields


class PrivateProfileSerializer(serializers.ModelSerializer):
    """Full profile serializer accessible strictly by the profile owner or platform admin."""

    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_email_verified = serializers.BooleanField(source='user.is_email_verified', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id',
            'email',
            'role',
            'is_email_verified',
            'display_name',
            'photo',
            'gender',
            'relationship_status',
            'date_of_birth',
            'is_age_verified',
            'bio',
            'interests',
            'instagram_handle',
            'linkedin_url',
            'sound_enabled',
            'notifications_enabled',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'is_age_verified', 'created_at', 'updated_at']

    def to_internal_value(self, data: Any) -> Dict[str, Any]:
        """Normalize multipart form data inputs for profile updates."""
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'photo' in mutable_data and mutable_data['photo'] == '':
            mutable_data['photo'] = None
        if 'interests' in mutable_data and isinstance(mutable_data['interests'], str):
            try:
                import json
                parsed = json.loads(mutable_data['interests'])
                if isinstance(parsed, list):
                    mutable_data['interests'] = parsed
            except (ValueError, TypeError):
                pass
        return super().to_internal_value(mutable_data)

    def validate_date_of_birth(self, value):
        """Validate that member is at least 18 years old."""
        if value:
            from datetime import date
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 18:
                raise serializers.ValidationError("You must be at least 18 years old to join Mingler.")
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for new member registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    display_name = serializers.CharField(max_length=100, required=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'password_confirm', 'display_name', 'role']
        extra_kwargs = {
            'role': {'default': 'member'},
        }

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': "Passwords do not match."})
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        from apps.users.models import EmailVerificationCode
        from apps.users.services import send_verification_email

        validated_data.pop('password_confirm')
        display_name = validated_data.pop('display_name', None)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'member'),
        )

        if display_name and hasattr(user, 'profile'):
            user.profile.display_name = display_name
            user.profile.save(update_fields=['display_name'])

        # Generate 6-digit OTP and send transactional verification email
        code = EmailVerificationCode.generate_code_for_user(user)
        send_verification_email(user, code)

        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for authenticating users and issuing JWT tokens."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_email_verified:
            raise serializers.ValidationError(
                "Your email address is not verified. Please verify your account using the 6-digit code sent to your email before logging in."
            )

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role

        return {
            'user': user,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }


class LogoutSerializer(serializers.Serializer):
    """Serializer for invalidating a refresh token on logout."""

    refresh = serializers.CharField(required=True, help_text='JWT refresh token to blacklist.')


class VerifyEmailSerializer(serializers.Serializer):
    """Serializer for verifying email address with a 6-digit OTP code."""

    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        from apps.users.models import EmailVerificationCode

        email = attrs.get('email', '').strip().lower()
        code = attrs.get('code', '').strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': "No account found with this email address."})

        if user.is_email_verified:
            attrs['user'] = user
            attrs['verification'] = None
            return attrs

        verification = EmailVerificationCode.objects.filter(
            user=user,
            code=code,
            is_used=False,
        ).order_by('-created_at').first()

        if not verification:
            raise serializers.ValidationError({'code': "Invalid verification code."})

        if not verification.is_valid():
            raise serializers.ValidationError({'code': "This verification code has expired. Please request a new code."})

        attrs['user'] = user
        attrs['verification'] = verification
        return attrs


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resending the 6-digit email verification OTP."""

    email = serializers.EmailField(required=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        from datetime import timedelta
        from django.utils import timezone
        from apps.users.models import EmailVerificationCode

        email = attrs.get('email', '').strip().lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': "No account found with this email address."})

        if user.is_email_verified:
            raise serializers.ValidationError({'email': "This email address is already verified."})

        # Cooldown: enforce 60 seconds between resend requests
        latest_code = EmailVerificationCode.objects.filter(user=user).order_by('-created_at').first()
        if latest_code and (timezone.now() - latest_code.created_at) < timedelta(seconds=60):
            remaining_seconds = 60 - int((timezone.now() - latest_code.created_at).total_seconds())
            raise serializers.ValidationError({
                'email': f"Please wait {remaining_seconds} seconds before requesting a new verification code."
            })

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset 6-digit OTP code."""

    email = serializers.EmailField(required=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        email = attrs.get('email', '').strip().lower()
        user = User.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError({'email': "No account found with this email address."})
        attrs['user'] = user
        return attrs


class PasswordResetVerifyCodeSerializer(serializers.Serializer):
    """Serializer for checking if the 6-digit password reset code is valid."""

    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        from apps.users.models import PasswordResetCode

        email = attrs.get('email', '').strip().lower()
        code = attrs.get('code', '').strip()

        user = User.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError({'email': "No account found with this email address."})

        reset_record = PasswordResetCode.objects.filter(
            user=user,
            code=code,
            is_used=False,
        ).order_by('-created_at').first()

        if not reset_record:
            raise serializers.ValidationError({'code': "Invalid password reset code."})

        if not reset_record.is_valid():
            raise serializers.ValidationError({'code': "This reset code has expired. Please request a new code."})

        attrs['user'] = user
        attrs['reset_record'] = reset_record
        return attrs


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for resetting password using verified OTP code."""

    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )

    def to_internal_value(self, data: Any) -> Dict[str, Any]:
        """Support both 'new_password' and 'password' key variations gracefully."""
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'password' in mutable_data and 'new_password' not in mutable_data:
            mutable_data['new_password'] = mutable_data['password']
        if 'password_confirm' in mutable_data and 'new_password_confirm' not in mutable_data:
            mutable_data['new_password_confirm'] = mutable_data['password_confirm']
        return super().to_internal_value(mutable_data)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        from apps.users.models import PasswordResetCode

        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Passwords do not match."})

        email = attrs.get('email', '').strip().lower()
        code = attrs.get('code', '').strip()

        user = User.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError({'email': "No account found with this email address."})

        reset_record = PasswordResetCode.objects.filter(
            user=user,
            code=code,
            is_used=False,
        ).order_by('-created_at').first()

        if not reset_record:
            raise serializers.ValidationError({'code': "Invalid password reset code."})

        if not reset_record.is_valid():
            raise serializers.ValidationError({'code': "This reset code has expired. Please request a new code."})

        attrs['user'] = user
        attrs['reset_record'] = reset_record
        return attrs

    def save(self) -> User:
        user = self.validated_data['user']
        reset_record = self.validated_data['reset_record']

        user.set_password(self.validated_data['new_password'])
        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['password', 'is_email_verified', 'is_active'])

        reset_record.is_used = True
        reset_record.save(update_fields=['is_used'])
        return user


class SocialAuthUrlSerializer(serializers.Serializer):
    """Serializer for generating OAuth2 provider authorization URLs."""

    from apps.users.models import SocialAccount
    provider = serializers.ChoiceField(
        choices=SocialAccount.PROVIDER_CHOICES,
        required=True,
    )
    redirect_uri = serializers.CharField(required=True)
    state = serializers.CharField(required=False, default='')


class SocialLoginSerializer(serializers.Serializer):
    """Serializer for social authentication via token or authorization code."""

    from apps.users.models import SocialAccount
    provider = serializers.ChoiceField(
        choices=SocialAccount.PROVIDER_CHOICES,
        required=True,
    )
    token = serializers.CharField(required=False, allow_blank=True, default='')
    code = serializers.CharField(required=False, allow_blank=True, default='')
    redirect_uri = serializers.CharField(required=False, allow_blank=True, default='')
    email = serializers.EmailField(required=False, allow_blank=True, default='')

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        token = attrs.get('token', '').strip()
        code = attrs.get('code', '').strip()
        redirect_uri = attrs.get('redirect_uri', '').strip()

        if not token and not code:
            raise serializers.ValidationError(
                "Either 'token' (ID/access token) or 'code' (authorization code) is required."
            )

        if code and not redirect_uri:
            raise serializers.ValidationError(
                {'redirect_uri': "'redirect_uri' is required when authenticating with authorization code."}
            )

        attrs['token'] = token
        attrs['code'] = code
        attrs['redirect_uri'] = redirect_uri
        return attrs


class SocialAccountSerializer(serializers.ModelSerializer):
    """Serializer for listing connected social accounts."""

    provider_name = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        from apps.users.models import SocialAccount
        model = SocialAccount
        fields = ['id', 'provider', 'provider_name', 'uid', 'created_at']
        read_only_fields = ['id', 'provider', 'provider_name', 'uid', 'created_at']

