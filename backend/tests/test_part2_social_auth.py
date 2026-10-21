"""Unit and integration tests for Part 2 OAuth2 Social Authentication.

Covers all 6 supported identity providers:
- Google
- Apple
- Facebook
- Instagram
- TikTok
- LinkedIn
Tests include token verification, code exchange, account linking,
profile auto-population, list connected accounts, and lockout safety guards.
"""
from unittest.mock import MagicMock, patch
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import Profile, SocialAccount, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestPart2SocialAuth:
    """Test suite for OAuth2 social authentication endpoints and services."""

    def test_social_auth_url_generation_all_providers(self, api_client, settings):
        """Generates valid OAuth2 consent URLs for all 6 supported providers."""
        settings.SOCIAL_AUTH_CONFIG = {
            'google': {'client_id': 'test-google-id'},
            'apple': {'client_id': 'uk.co.mingler.web'},
            'facebook': {'client_id': 'test-fb-id'},
            'instagram': {'client_id': 'test-insta-id'},
            'tiktok': {'client_key': 'test-tiktok-key'},
            'linkedin': {'client_id': 'test-linkedin-id'},
        }

        url = '/api/v1/auth/social/url/'
        redirect = 'https://mingler.co.uk/auth/callback'

        for provider in ['google', 'apple', 'facebook', 'instagram', 'tiktok', 'linkedin']:
            res = api_client.get(f'{url}?provider={provider}&redirect_uri={redirect}&state=test_state')
            assert res.status_code == status.HTTP_200_OK
            assert res.data['success'] is True
            assert res.data['provider'] == provider
            assert 'authorization_url' in res.data
            assert 'redirect_uri=' in res.data['authorization_url']
            assert 'mingler.co.uk' in res.data['authorization_url']

    def test_social_auth_url_unsupported_provider(self, api_client):
        """Unsupported provider query returns 400 Bad Request."""
        url = '/api/v1/auth/social/url/?provider=twitter&redirect_uri=https://mingler.co.uk/callback'
        res = api_client.get(url)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    @patch('requests.get')
    def test_google_login_new_user(self, mock_get, api_client):
        """Google token authentication creates a new user, profile, and social link."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'sub': 'google-uid-1001',
            'email': 'alice.london@gmail.com',
            'name': 'Alice London',
            'picture': 'https://lh3.googleusercontent.com/alice.jpg',
            'email_verified': True,
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'google',
            'token': 'mock-valid-google-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data['success'] is True
        assert data['is_new_user'] is True
        assert data['provider'] == 'google'
        assert 'tokens' in data
        assert data['user']['email'] == 'alice.london@gmail.com'
        assert data['user']['is_active'] is True
        assert data['user']['is_email_verified'] is True

        # Verify database records
        user = User.objects.get(email='alice.london@gmail.com')
        assert user.is_active is True
        assert user.is_email_verified is True
        assert not user.has_usable_password()

        # Verify profile
        profile = user.profile
        assert profile.display_name == 'Alice London'
        assert profile.photo == 'https://lh3.googleusercontent.com/alice.jpg'

        # Verify SocialAccount
        social = SocialAccount.objects.get(user=user, provider='google')
        assert social.uid == 'google-uid-1001'

    @patch('requests.get')
    def test_google_login_existing_user_auto_links(self, mock_get, api_client):
        """Google login for an existing user email links the social account without duplicate users."""
        existing_user = User.objects.create_user(
            email='existing.member@gmail.com',
            password='OldSecurePassword123!',
            is_active=False,
            is_email_verified=False,
        )

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'sub': 'google-uid-1002',
            'email': 'existing.member@gmail.com',
            'name': 'Existing Member',
            'picture': 'https://lh3.googleusercontent.com/existing.jpg',
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'google',
            'token': 'mock-valid-google-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_new_user'] is False

        # Verify user activated and verified
        existing_user.refresh_from_db()
        assert existing_user.is_active is True
        assert existing_user.is_email_verified is True
        assert existing_user.has_usable_password()  # original password preserved

        # Social account linked
        assert SocialAccount.objects.filter(user=existing_user, provider='google', uid='google-uid-1002').exists()
        assert User.objects.filter(email='existing.member@gmail.com').count() == 1

    @patch('jwt.decode')
    def test_apple_login_jwt(self, mock_jwt_decode, api_client):
        """Apple Sign In verifies ID token payload and provisions user."""
        mock_jwt_decode.return_value = {
            'sub': 'apple-sub-998877',
            'email': 'apple.user@privaterelay.appleid.com',
            'email_verified': 'true',
        }

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'apple',
            'token': 'mock-apple-id-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data['is_new_user'] is True
        assert data['user']['email'] == 'apple.user@privaterelay.appleid.com'

        user = User.objects.get(email='apple.user@privaterelay.appleid.com')
        assert SocialAccount.objects.filter(user=user, provider='apple', uid='apple-sub-998877').exists()

    @patch('requests.get')
    def test_facebook_login(self, mock_get, api_client):
        """Facebook Graph API authentication verifies access token and fetches profile."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 'fb-uid-554433',
            'name': 'Fiona Gallagher',
            'email': 'fiona@facebook-example.com',
            'picture': {'data': {'url': 'https://graph.facebook.com/picture.jpg'}},
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'facebook',
            'token': 'mock-fb-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'fiona@facebook-example.com'
        user = User.objects.get(email='fiona@facebook-example.com')
        assert user.profile.display_name == 'Fiona Gallagher'
        assert user.profile.photo == 'https://graph.facebook.com/picture.jpg'

    @patch('requests.get')
    def test_linkedin_login(self, mock_get, api_client):
        """LinkedIn OpenID Connect verifies userinfo and provisions member."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'sub': 'linkedin-sub-771122',
            'name': 'Oliver Twist',
            'email': 'oliver.twist@linkedin-example.com',
            'picture': 'https://media.licdn.com/dms/image/oliver.jpg',
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'linkedin',
            'token': 'mock-linkedin-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'oliver.twist@linkedin-example.com'
        user = User.objects.get(email='oliver.twist@linkedin-example.com')
        assert user.profile.display_name == 'Oliver Twist'

    @patch('requests.get')
    def test_tiktok_login_with_provided_email(self, mock_get, api_client):
        """TikTok Login Kit authentication with optional frontend email."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {
                'user': {
                    'open_id': 'tiktok-open-id-12345',
                    'display_name': 'TikTok Creator',
                    'avatar_url': 'https://p16-tiktok.com/avatar.jpg',
                }
            }
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'tiktok',
            'token': 'mock-tiktok-token',
            'email': 'creator@tiktok-stars.co.uk',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'creator@tiktok-stars.co.uk'
        user = User.objects.get(email='creator@tiktok-stars.co.uk')
        assert user.profile.display_name == 'TikTok Creator'
        assert user.profile.photo == 'https://p16-tiktok.com/avatar.jpg'

    @patch('requests.get')
    def test_instagram_login_fallback_email(self, mock_get, api_client):
        """Instagram Basic Display generates deterministic synthetic email when email omitted."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 'instagram-id-9988',
            'username': 'london_foodie',
        }
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'instagram',
            'token': 'mock-insta-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        user = User.objects.get(social_accounts__provider='instagram', social_accounts__uid='instagram-id-9988')
        assert 'instagram' in user.email
        assert user.profile.display_name == 'london_foodie'

    @patch('requests.post')
    @patch('requests.get')
    def test_authorization_code_exchange_flow(self, mock_get, mock_post, api_client, settings):
        """Server-side code exchange with provider exchanges code and verifies user."""
        settings.SOCIAL_AUTH_CONFIG = {
            'google': {'client_id': 'g-id', 'client_secret': 'g-secret'},
        }

        # Mock token exchange
        token_res = MagicMock()
        token_res.status_code = 200
        token_res.json.return_value = {'access_token': 'exchanged-google-token'}
        mock_post.return_value = token_res

        # Mock userinfo
        userinfo_res = MagicMock()
        userinfo_res.status_code = 200
        userinfo_res.json.return_value = {
            'sub': 'google-code-uid-77',
            'email': 'code.user@gmail.com',
            'name': 'Code User',
        }
        mock_get.return_value = userinfo_res

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'google',
            'code': 'google-auth-code-12345',
            'redirect_uri': 'https://mingler.co.uk/callback',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'code.user@gmail.com'

    @patch('requests.get')
    def test_invalid_token_returns_400(self, mock_get, api_client):
        """Invalid or rejected social token returns 400 Bad Request."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {'error': {'message': 'Invalid OAuth access token.'}}
        mock_get.return_value = mock_response

        login_url = '/api/v1/auth/social/login/'
        payload = {
            'provider': 'facebook',
            'token': 'bogus-expired-token',
        }
        response = api_client.post(login_url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_social_accounts_list_and_disconnect(self, api_client):
        """Authenticated member can view and safely disconnect a secondary social account."""
        user = User.objects.create_user(
            email='multi.social@mingler.co.uk',
            password='UsablePassword987!',
            is_active=True,
            is_email_verified=True,
        )
        api_client.force_authenticate(user=user)

        SocialAccount.objects.create(user=user, provider='google', uid='g-1')
        SocialAccount.objects.create(user=user, provider='apple', uid='a-1')

        # List accounts
        list_res = api_client.get('/api/v1/auth/social/accounts/')
        assert list_res.status_code == status.HTTP_200_OK
        assert len(list_res.data['social_accounts']) == 2

        # Disconnect one account
        del_res = api_client.delete('/api/v1/auth/social/accounts/google/')
        assert del_res.status_code == status.HTTP_200_OK
        assert del_res.data['success'] is True
        assert not SocialAccount.objects.filter(user=user, provider='google').exists()
        assert SocialAccount.objects.filter(user=user, provider='apple').exists()

    def test_social_account_disconnect_lockout_prevention(self, api_client):
        """User without password cannot disconnect their only social account to prevent lockout."""
        user = User.objects.create_user(
            email='single.social@mingler.co.uk',
            password=None,
            is_active=True,
            is_email_verified=True,
        )
        user.set_unusable_password()
        user.save()

        SocialAccount.objects.create(user=user, provider='google', uid='g-only')
        api_client.force_authenticate(user=user)

        # Attempt to disconnect sole login method
        del_res = api_client.delete('/api/v1/auth/social/accounts/google/')
        assert del_res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot disconnect your only login method' in str(del_res.data).lower()
        assert SocialAccount.objects.filter(user=user, provider='google').exists()
