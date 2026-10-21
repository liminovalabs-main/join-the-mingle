"""Authentication URL patterns."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import (
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordResetVerifyCodeView,
    RegisterView,
    ResendVerificationCodeView,
    SocialAccountDisconnectView,
    SocialAccountListView,
    SocialAuthUrlView,
    SocialLoginView,
    VerifyEmailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-verification/', ResendVerificationCodeView.as_view(), name='auth-resend-verification'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='auth-password-reset-request'),
    path('password-reset/verify-code/', PasswordResetVerifyCodeView.as_view(), name='auth-password-reset-verify'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('social/url/', SocialAuthUrlView.as_view(), name='auth-social-url'),
    path('social/login/', SocialLoginView.as_view(), name='auth-social-login'),
    path('social/accounts/', SocialAccountListView.as_view(), name='auth-social-accounts-list'),
    path('social/accounts/<str:provider>/', SocialAccountDisconnectView.as_view(), name='auth-social-account-disconnect'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]
