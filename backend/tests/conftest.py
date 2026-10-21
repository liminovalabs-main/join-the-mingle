"""Pytest fixtures for Project Mingler backend testing."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, Profile


@pytest.fixture
def api_client():
    """Unauthenticated DRF APIClient."""
    return APIClient()


@pytest.fixture
def member_user(db):
    """Standard member user with automatically created Profile."""
    user = User.objects.create_user(
        email='alice@example.com',
        password='StrongPassword123!',
        role='member',
        is_active=True,
        is_email_verified=True,
    )
    user.profile.display_name = 'Alice Wonderland'
    user.profile.bio = 'Love social mingling in London'
    user.profile.save()
    return user


@pytest.fixture
def auth_client(api_client, member_user):
    """Authenticated APIClient for member_user."""
    refresh = RefreshToken.for_user(member_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def second_member(db):
    """Second member user for public profile inspection and mutual interactions."""
    user = User.objects.create_user(
        email='bob@example.com',
        password='AnotherPassword123!',
        role='member',
        is_active=True,
        is_email_verified=True,
    )
    user.profile.display_name = 'Bob Builder'
    user.profile.bio = 'Architect in Shoreditch'
    user.profile.save()
    return user


@pytest.fixture
def admin_user(db):
    """Platform administrator user."""
    return User.objects.create_superuser(
        email='admin@mingler.co.uk',
        password='AdminPassword123!',
    )
