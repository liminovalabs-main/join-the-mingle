"""Views for authentication and user profiles.

Provides endpoints for registration, login, token refresh, private profile management,
and UK GDPR-compliant public attendee profile inspection.
"""
from typing import List
import uuid

from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from rest_framework import generics, permissions, serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.models import EmailVerificationCode, PasswordResetCode, Profile, SocialAccount, User
from apps.users.serializers import (
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifyCodeSerializer,
    PrivateProfileSerializer,
    PublicProfileSerializer,
    ResendVerificationSerializer,
    SocialAccountSerializer,
    SocialAuthUrlSerializer,
    SocialLoginSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    VerifyEmailSerializer,
)
from apps.users.services import send_password_reset_email, send_verification_email
from apps.users.social_services import SocialAuthService


class RegisterView(generics.CreateAPIView):
    """Register a new member and trigger email verification."""

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        profile_data = PrivateProfileSerializer(user.profile).data

        return Response(
            {
                'success': True,
                'message': 'Account created successfully. A 6-digit verification code has been sent to your email. Please verify your email to activate your account.',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_active': user.is_active,
                    'is_email_verified': user.is_email_verified,
                },
                'profile': profile_data,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """Verify a user's email address using the 6-digit OTP code."""

    permission_classes = [permissions.AllowAny]
    serializer_class = VerifyEmailSerializer

    @extend_schema(request=VerifyEmailSerializer)
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        verification = serializer.validated_data.get('verification')

        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['is_email_verified', 'is_active'])

        if verification:
            verification.is_used = True
            verification.save(update_fields=['is_used'])

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        profile_data = PrivateProfileSerializer(user.profile).data

        return Response(
            {
                'success': True,
                'message': 'Email verified successfully. Your account is now active.',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_active': True,
                    'is_email_verified': True,
                },
                'profile': profile_data,
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationCodeView(APIView):
    """Resend a fresh 6-digit email verification OTP with 60s cooldown."""

    permission_classes = [permissions.AllowAny]
    serializer_class = ResendVerificationSerializer

    @extend_schema(request=ResendVerificationSerializer)
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        code = EmailVerificationCode.generate_code_for_user(user)
        send_verification_email(user, code)

        return Response(
            {
                'success': True,
                'message': 'A new 6-digit verification code has been sent to your email.',
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """Request a 6-digit OTP code to reset account password."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    @extend_schema(request=PasswordResetRequestSerializer)
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        code = PasswordResetCode.generate_code_for_user(user)
        send_password_reset_email(user, code)

        return Response(
            {
                'success': True,
                'message': 'A 6-digit password reset code has been sent to your email.',
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetVerifyCodeView(APIView):
    """Verify that a 6-digit password reset OTP is valid before showing password form."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetVerifyCodeSerializer

    @extend_schema(request=PasswordResetVerifyCodeSerializer)
    def post(self, request):
        serializer = PasswordResetVerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            {
                'success': True,
                'message': 'Verification code is valid. You may now set a new password.',
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Set a new password using the verified 6-digit OTP code."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    @extend_schema(request=PasswordResetConfirmSerializer)
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'success': True,
                'message': 'Your password has been reset successfully. You can now log in with your new password.',
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """Authenticate with email and password to obtain JWT tokens."""

    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer

    @extend_schema(request=UserLoginSerializer)
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        user = validated_data['user']
        tokens = validated_data['tokens']
        profile_data = PrivateProfileSerializer(user.profile).data

        return Response(
            {
                'success': True,
                'message': 'Login successful.',
                'tokens': tokens,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_active': user.is_active,
                    'is_email_verified': user.is_email_verified,
                },
                'profile': profile_data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Blacklist the provided refresh token to securely invalidate the session."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(request=LogoutSerializer)
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh_token = serializer.validated_data['refresh']

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'success': True, 'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {'success': False, 'error': {'message': 'Invalid or expired token.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MyProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's private profile."""

    serializer_class = PrivateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user.profile

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'success': True, 'profile': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'message': 'Profile updated successfully.', 'profile': serializer.data})


class PublicProfileListView(APIView):
    """Batch-fetch sanitized public attendee profiles by UUIDs.

    UK GDPR Compliance:
        Strictly applies PublicProfileSerializer so date_of_birth,
        email, and account credentials are never transmitted.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='ids',
                description='Comma-separated list of profile UUIDs',
                required=False,
                type=str,
            )
        ],
        responses={200: PublicProfileSerializer(many=True)},
    )
    def get(self, request):
        ids_str = request.query_params.get('ids', '')
        if not ids_str:
            return Response({'success': True, 'profiles': []})

        id_list = [raw_id.strip() for raw_id in ids_str.split(',') if raw_id.strip()]
        valid_uuids: List[uuid.UUID] = []
        for raw_id in id_list:
            try:
                valid_uuids.append(uuid.UUID(raw_id))
            except ValueError:
                continue

        profiles = Profile.objects.filter(id__in=valid_uuids)
        serializer = PublicProfileSerializer(profiles, many=True)
        return Response({'success': True, 'profiles': serializer.data})


class SocialAuthUrlView(APIView):
    """Return the OAuth2 authorization consent URL for a given provider."""

    permission_classes = [permissions.AllowAny]
    serializer_class = SocialAuthUrlSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter(name='provider', description='google, apple, facebook, instagram, tiktok, or linkedin', required=True, type=str),
            OpenApiParameter(name='redirect_uri', description='Callback URL on the frontend', required=True, type=str),
            OpenApiParameter(name='state', description='Optional CSRF state parameter', required=False, type=str),
        ],
    )
    def get(self, request):
        serializer = SocialAuthUrlSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data['provider']
        redirect_uri = serializer.validated_data['redirect_uri']
        state = serializer.validated_data.get('state')

        auth_url = SocialAuthService.get_authorization_url(
            provider_name=provider,
            redirect_uri=redirect_uri,
            state=state,
        )
        return Response(
            {
                'success': True,
                'provider': provider,
                'authorization_url': auth_url,
            },
            status=status.HTTP_200_OK,
        )


class SocialLoginView(APIView):
    """Authenticate or register a user via OAuth2 social provider (Google, Apple, Facebook, Instagram, TikTok, LinkedIn)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = SocialLoginSerializer

    @extend_schema(request=SocialLoginSerializer)
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user, is_new_user = SocialAuthService.authenticate(
            provider_name=data['provider'],
            token=data.get('token'),
            code=data.get('code'),
            redirect_uri=data.get('redirect_uri'),
            email=data.get('email'),
        )

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['is_email_verified'] = user.is_email_verified

        tokens = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        profile_data = PrivateProfileSerializer(user.profile).data

        return Response(
            {
                'success': True,
                'message': 'Welcome to Mingler! Account created successfully.' if is_new_user else 'Social login successful.',
                'is_new_user': is_new_user,
                'provider': data['provider'],
                'tokens': tokens,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'is_active': user.is_active,
                    'is_email_verified': user.is_email_verified,
                },
                'profile': profile_data,
            },
            status=status.HTTP_200_OK,
        )


class SocialAccountListView(generics.ListAPIView):
    """List all social accounts linked to the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SocialAccountSerializer
    queryset = SocialAccount.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return SocialAccount.objects.none()
        return self.request.user.social_accounts.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'social_accounts': serializer.data})


class SocialAccountDisconnectView(APIView):
    """Disconnect a linked social account from the current user."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=None,
        parameters=[
            OpenApiParameter(
                name='provider',
                location=OpenApiParameter.PATH,
                description='Provider to unlink (e.g. google, apple, facebook, instagram, tiktok, linkedin)',
                type=str,
            )
        ],
        responses={
            200: inline_serializer(
                name='SocialAccountDisconnectResponse',
                fields={
                    'success': serializers.BooleanField(),
                    'message': serializers.CharField(),
                },
            )
        },
    )
    def delete(self, request, provider):
        provider_clean = (provider or '').strip().lower()
        social_acc = request.user.social_accounts.filter(provider=provider_clean).first()
        if not social_acc:
            return Response(
                {
                    'success': False,
                    'error': {'message': f"No connected {provider_clean.title()} account found."},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not request.user.has_usable_password() and request.user.social_accounts.count() <= 1:
            return Response(
                {
                    'success': False,
                    'error': {
                        'message': "Cannot disconnect your only login method. Please set an account password first."
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        social_acc.delete()
        return Response(
            {
                'success': True,
                'message': f"Successfully disconnected your {provider_clean.title()} account.",
            },
            status=status.HTTP_200_OK,
        )

