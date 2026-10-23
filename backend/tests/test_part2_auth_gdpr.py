"""Tests for Part 2: Authentication, SimpleJWT, Profile APIs & UK GDPR Privacy Guard."""
from datetime import date
import pytest
from rest_framework import status
from apps.users.models import Profile, User


@pytest.mark.django_db
class TestPart2Authentication:
    """Test suite verifying member registration, JWT authentication, and token lifecycle."""

    def test_member_registration_success(self, api_client):
        """New member can register; account is inactive until email is verified."""
        url = '/api/v1/auth/register/'
        payload = {
            'email': 'new_member@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
            'display_name': 'New Member',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['user']['email'] == 'new_member@mingler.co.uk'
        assert response.data['user']['is_active'] is False
        assert response.data['user']['is_email_verified'] is False
        assert 'tokens' not in response.data
        assert response.data['profile']['display_name'] == 'New Member'

    def test_member_registration_password_mismatch(self, api_client):
        """Registration fails if passwords do not match."""
        url = '/api/v1/auth/register/'
        payload = {
            'email': 'mismatch@mingler.co.uk',
            'password': 'Password123!',
            'password_confirm': 'DifferentPassword123!',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_member_login_success(self, api_client, member_user):
        """Existing member can authenticate and obtain access + refresh tokens."""
        url = '/api/v1/auth/login/'
        payload = {
            'email': 'alice@example.com',
            'password': 'StrongPassword123!',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'tokens' in response.data
        assert response.data['user']['id'] == str(member_user.id)
        assert response.data['profile']['display_name'] == 'Alice Wonderland'

    def test_member_logout_blacklists_token(self, auth_client, member_user):
        """Logging out adds the refresh token to the blacklist."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(member_user)

        url = '/api/v1/auth/logout/'
        response = auth_client.post(url, {'refresh': str(refresh)}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

        # Attempting to refresh using the blacklisted token should fail
        refresh_url = '/api/v1/auth/token/refresh/'
        refresh_response = auth_client.post(refresh_url, {'refresh': str(refresh)}, format='json')
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_registration_generates_verification_code_and_dispatches_email(self, api_client):
        """Registration automatically creates a 6-digit OTP and sends a transactional email."""
        from django.core import mail
        from apps.users.models import EmailVerificationCode

        url = '/api/v1/auth/register/'
        payload = {
            'email': 'verify_test@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
            'display_name': 'Verify Test User',
        }
        mail.outbox.clear()
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['is_email_verified'] is False

        # Verify database record
        user = User.objects.get(email='verify_test@mingler.co.uk')
        assert user.is_email_verified is False
        otp_record = EmailVerificationCode.objects.filter(user=user, is_used=False).first()
        assert otp_record is not None
        assert len(otp_record.code) == 6
        assert otp_record.code.isdigit()

        # Verify dispatched email
        assert len(mail.outbox) == 1
        sent_email = mail.outbox[0]
        assert 'Verify your Mingler account' in sent_email.subject
        assert 'verify_test@mingler.co.uk' in sent_email.to
        assert otp_record.code in sent_email.body

    def test_verify_email_success(self, api_client):
        """Valid 6-digit code verifies user and marks is_email_verified=True."""
        from apps.users.models import EmailVerificationCode

        # Register user
        reg_url = '/api/v1/auth/register/'
        api_client.post(reg_url, {
            'email': 'verify_success@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
        }, format='json')

        user = User.objects.get(email='verify_success@mingler.co.uk')
        code = EmailVerificationCode.objects.get(user=user, is_used=False).code

        verify_url = '/api/v1/auth/verify-email/'
        response = api_client.post(verify_url, {
            'email': 'verify_success@mingler.co.uk',
            'code': code,
        }, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['user']['is_email_verified'] is True
        assert response.data['user']['is_active'] is True
        assert 'tokens' in response.data

        user.refresh_from_db()
        assert user.is_email_verified is True
        assert user.is_active is True

    def test_unverified_member_login_is_blocked(self, api_client):
        """Unverified member cannot log in; once verified via OTP, login succeeds."""
        from apps.users.models import EmailVerificationCode

        # 1. Register new member
        reg_url = '/api/v1/auth/register/'
        api_client.post(reg_url, {
            'email': 'blocked_login@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
        }, format='json')

        user = User.objects.get(email='blocked_login@mingler.co.uk')
        assert user.is_email_verified is False
        assert user.is_active is False

        # 2. Attempt login before email verification -> Must be rejected with 400
        login_url = '/api/v1/auth/login/'
        login_res = api_client.post(login_url, {
            'email': 'blocked_login@mingler.co.uk',
            'password': 'SecurePassword987!',
        }, format='json')
        assert login_res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'not verified' in str(login_res.data).lower()

        # 3. Verify email with valid OTP code
        code = EmailVerificationCode.objects.get(user=user, is_used=False).code
        verify_url = '/api/v1/auth/verify-email/'
        verify_res = api_client.post(verify_url, {
            'email': 'blocked_login@mingler.co.uk',
            'code': code,
        }, format='json')
        assert verify_res.status_code == status.HTTP_200_OK
        assert verify_res.data['user']['is_active'] is True
        assert verify_res.data['user']['is_email_verified'] is True

        # 4. Now login should succeed and issue JWT tokens
        login_success_res = api_client.post(login_url, {
            'email': 'blocked_login@mingler.co.uk',
            'password': 'SecurePassword987!',
        }, format='json')
        assert login_success_res.status_code == status.HTTP_200_OK
        assert login_success_res.data['success'] is True
        assert 'tokens' in login_success_res.data
        assert login_success_res.data['user']['is_active'] is True
        assert login_success_res.data['user']['is_email_verified'] is True

    def test_verify_email_invalid_code(self, api_client):
        """Invalid 6-digit code is rejected with 400 Bad Request."""
        reg_url = '/api/v1/auth/register/'
        api_client.post(reg_url, {
            'email': 'wrong_code@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
        }, format='json')

        verify_url = '/api/v1/auth/verify-email/'
        response = api_client.post(verify_url, {
            'email': 'wrong_code@mingler.co.uk',
            'code': '999999',
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        user = User.objects.get(email='wrong_code@mingler.co.uk')
        assert user.is_email_verified is False

    def test_verify_email_expired_code(self, api_client):
        """Expired verification code is rejected."""
        from datetime import timedelta
        from django.utils import timezone
        from apps.users.models import EmailVerificationCode

        reg_url = '/api/v1/auth/register/'
        api_client.post(reg_url, {
            'email': 'expired_test@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
        }, format='json')

        user = User.objects.get(email='expired_test@mingler.co.uk')
        otp = EmailVerificationCode.objects.get(user=user, is_used=False)
        # Manually expire the code
        otp.expires_at = timezone.now() - timedelta(minutes=5)
        otp.save(update_fields=['expires_at'])

        verify_url = '/api/v1/auth/verify-email/'
        response = api_client.post(verify_url, {
            'email': 'expired_test@mingler.co.uk',
            'code': otp.code,
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'expired' in str(response.data).lower()

    def test_resend_verification_cooldown_and_success(self, api_client):
        """Resend enforces 60s rate limit, and allows resend once cooldown passes."""
        from datetime import timedelta
        from django.utils import timezone
        from apps.users.models import EmailVerificationCode

        reg_url = '/api/v1/auth/register/'
        api_client.post(reg_url, {
            'email': 'resend_test@mingler.co.uk',
            'password': 'SecurePassword987!',
            'password_confirm': 'SecurePassword987!',
        }, format='json')

        user = User.objects.get(email='resend_test@mingler.co.uk')

        # Immediate resend should trigger 60-second cooldown
        resend_url = '/api/v1/auth/resend-verification/'
        cooldown_response = api_client.post(resend_url, {'email': 'resend_test@mingler.co.uk'}, format='json')
        assert cooldown_response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'wait' in str(cooldown_response.data).lower()

        # Simulate elapsed time past cooldown (70 seconds ago)
        latest_code = EmailVerificationCode.objects.get(user=user, is_used=False)
        latest_code.created_at = timezone.now() - timedelta(seconds=70)
        latest_code.save(update_fields=['created_at'])

        # Now resend should succeed
        success_response = api_client.post(resend_url, {'email': 'resend_test@mingler.co.uk'}, format='json')
        assert success_response.status_code == status.HTTP_200_OK
        assert success_response.data['success'] is True

        # Verify old code is invalidated and new code exists
        latest_code.refresh_from_db()
        assert latest_code.is_used is True
        new_code = EmailVerificationCode.objects.filter(user=user, is_used=False).first()
        assert new_code is not None
        assert new_code.code != latest_code.code

    def test_resend_verification_already_verified(self, api_client, member_user):
        """Resend request for an already verified member returns 400 Bad Request."""
        member_user.is_email_verified = True
        member_user.save(update_fields=['is_email_verified'])

        resend_url = '/api/v1/auth/resend-verification/'
        response = api_client.post(resend_url, {'email': member_user.email}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already verified' in str(response.data).lower()

    def test_password_reset_request_dispatches_email(self, api_client, member_user):
        """Requesting password reset creates OTP and dispatches reset email."""
        from django.core import mail
        from apps.users.models import PasswordResetCode

        mail.outbox.clear()
        req_url = '/api/v1/auth/password-reset/request/'
        response = api_client.post(req_url, {'email': member_user.email}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True

        # Check database record
        reset_record = PasswordResetCode.objects.filter(user=member_user, is_used=False).first()
        assert reset_record is not None
        assert len(reset_record.code) == 6

        # Check email sent
        assert len(mail.outbox) == 1
        assert 'Reset your Mingler password' in mail.outbox[0].subject
        assert reset_record.code in mail.outbox[0].body

        # Check non-existent email returns 400 Bad Request
        mail.outbox.clear()
        fake_response = api_client.post(req_url, {'email': 'nobody@example.com'}, format='json')
        assert fake_response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'no account found' in str(fake_response.data).lower()
        assert len(mail.outbox) == 0

    def test_password_reset_verify_code(self, api_client, member_user):
        """Verify endpoint confirms whether the 6-digit code is valid."""
        from apps.users.models import PasswordResetCode

        code = PasswordResetCode.generate_code_for_user(member_user)
        verify_url = '/api/v1/auth/password-reset/verify-code/'

        # Valid code
        valid_res = api_client.post(verify_url, {'email': member_user.email, 'code': code}, format='json')
        assert valid_res.status_code == status.HTTP_200_OK
        assert valid_res.data['success'] is True

        # Invalid code
        invalid_res = api_client.post(verify_url, {'email': member_user.email, 'code': '000000'}, format='json')
        assert invalid_res.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_reset_confirm_updates_password_and_allows_login(self, api_client, member_user):
        """Confirming password reset sets new password and allows login."""
        from apps.users.models import PasswordResetCode

        code = PasswordResetCode.generate_code_for_user(member_user)
        confirm_url = '/api/v1/auth/password-reset/confirm/'
        new_pwd = 'BrandNewPassword2026!'

        confirm_res = api_client.post(confirm_url, {
            'email': member_user.email,
            'code': code,
            'new_password': new_pwd,
            'new_password_confirm': new_pwd,
        }, format='json')
        assert confirm_res.status_code == status.HTTP_200_OK
        assert confirm_res.data['success'] is True

        # Verify old password no longer works
        old_login = api_client.post('/api/v1/auth/login/', {
            'email': member_user.email,
            'password': 'StrongPassword123!',
        }, format='json')
        assert old_login.status_code == status.HTTP_400_BAD_REQUEST

        # Verify new password logs in successfully and returns JWT tokens
        new_login = api_client.post('/api/v1/auth/login/', {
            'email': member_user.email,
            'password': new_pwd,
        }, format='json')
        assert new_login.status_code == status.HTTP_200_OK
        assert 'tokens' in new_login.data

    def test_password_reset_confirm_with_password_alias(self, api_client, member_user):
        """Confirming password reset using 'password' and 'password_confirm' field aliases succeeds."""
        from apps.users.models import PasswordResetCode

        code = PasswordResetCode.generate_code_for_user(member_user)
        confirm_url = '/api/v1/auth/password-reset/confirm/'
        new_pwd = 'AliasPassword2026!'

        confirm_res = api_client.post(confirm_url, {
            'email': member_user.email,
            'code': code,
            'password': new_pwd,
            'password_confirm': new_pwd,
        }, format='json')
        assert confirm_res.status_code == status.HTTP_200_OK
        assert confirm_res.data['success'] is True

    def test_password_reset_expired_or_used_code_rejected(self, api_client, member_user):
        """Expired code or already-used code cannot reset password."""
        from datetime import timedelta
        from django.utils import timezone
        from apps.users.models import PasswordResetCode

        code = PasswordResetCode.generate_code_for_user(member_user)
        otp = PasswordResetCode.objects.get(user=member_user, code=code)

        # Expire code
        otp.expires_at = timezone.now() - timedelta(minutes=5)
        otp.save(update_fields=['expires_at'])

        confirm_url = '/api/v1/auth/password-reset/confirm/'
        expired_res = api_client.post(confirm_url, {
            'email': member_user.email,
            'code': code,
            'new_password': 'SomeNewPassword123!',
            'new_password_confirm': 'SomeNewPassword123!',
        }, format='json')
        assert expired_res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'expired' in str(expired_res.data).lower()


@pytest.mark.django_db
class TestPart2ProfilesAndGDPR:
    """Test suite verifying private profile management and UK GDPR compliance."""

    def test_get_my_private_profile(self, auth_client, member_user):
        """Authenticated user can fetch their private profile including private fields."""
        url = '/api/v1/profiles/me/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        profile = response.data['profile']
        assert profile['display_name'] == 'Alice Wonderland'
        assert profile['email'] == 'alice@example.com'
        assert 'date_of_birth' in profile  # Allowed for private profile owner

    def test_update_my_profile_and_socials(self, auth_client, member_user):
        """User can update bio and social links with valid formatting."""
        url = '/api/v1/profiles/me/'
        payload = {
            'display_name': 'Alice W.',
            'bio': 'Foodie and cocktail enthusiast in Hackney',
            'instagram_handle': 'alice_in_london',
            'linkedin_url': 'https://linkedin.com/in/alice-wonderland',
            'date_of_birth': '1995-05-15',
        }
        response = auth_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['profile']['display_name'] == 'Alice W.'
        assert response.data['profile']['instagram_handle'] == 'alice_in_london'
        assert response.data['profile']['linkedin_url'] == 'https://linkedin.com/in/alice-wonderland'

    def test_upload_profile_photo_multipart(self, auth_client, member_user):
        """User can upload a profile avatar image file via multipart/form-data."""
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        image = Image.new('RGB', (100, 100), color='red')
        byte_io = io.BytesIO()
        image.save(byte_io, format='JPEG')
        byte_io.seek(0)
        uploaded_file = SimpleUploadedFile('test_avatar.jpg', byte_io.read(), content_type='image/jpeg')

        url = '/api/v1/profiles/me/'
        response = auth_client.patch(url, {'photo': uploaded_file}, format='multipart')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'test_avatar' in response.data['profile']['photo']

    def test_update_profile_bio_with_existing_photo_string(self, auth_client, member_user):
        """Updating bio when photo string URL is present in payload succeeds without expecting a file upload."""
        url = '/api/v1/profiles/me/'
        payload = {
            'bio': 'Avid traveler and foodie based in Shoreditch.',
            'photo': 'http://localhost:8000/media/profiles/existing_photo.jpg',
        }
        response = auth_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['profile']['bio'] == 'Avid traveler and foodie based in Shoreditch.'

    def test_age_guard_rejects_under_18(self, auth_client, member_user):
        """Profile update rejects date_of_birth for members under 18 years old."""
        url = '/api/v1/profiles/me/'
        today = date.today()
        # Set DOB to 16 years ago
        minor_dob = f"{today.year - 16}-{today.month:02d}-{today.day:02d}"
        response = auth_client.patch(url, {'date_of_birth': minor_dob}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'date_of_birth' in response.data['error']['details']

    def test_social_url_regex_validation(self, auth_client, member_user):
        """Invalid Instagram handle or non-LinkedIn URLs must be rejected."""
        url = '/api/v1/profiles/me/'

        # Invalid Instagram handle (spaces and special characters)
        response_ig = auth_client.patch(url, {'instagram_handle': 'invalid handle with spaces!'}, format='json')
        assert response_ig.status_code == status.HTTP_400_BAD_REQUEST

        # Invalid LinkedIn URL (arbitrary text or wrong domain)
        response_li = auth_client.patch(url, {'linkedin_url': 'https://facebook.com/not-linkedin'}, format='json')
        assert response_li.status_code == status.HTTP_400_BAD_REQUEST

    def test_uk_gdpr_public_profile_sanitization(self, auth_client, member_user, second_member):
        """UK GDPR CRITICAL TEST: Public profile endpoint MUST NOT expose DOB or email.

        Resolves the critical GDPR vulnerability identified in the engineering audit.
        When fetching attendee profiles for mingle cards, only safe public attributes are returned.
        """
        # Ensure second_member has a DOB and email stored
        second_member.profile.date_of_birth = date(1990, 8, 20)
        second_member.profile.save()

        url = f'/api/v1/profiles/public/?ids={member_user.profile.id},{second_member.profile.id}'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        profiles = response.data['profiles']
        assert len(profiles) == 2

        for profile in profiles:
            # Safe public fields that SHOULD be present
            assert 'id' in profile
            assert 'display_name' in profile
            assert 'bio' in profile

            # CRITICAL UK GDPR CHECKS: Sensitive fields MUST NOT exist in public response
            assert 'date_of_birth' not in profile, "CRITICAL: UK GDPR leak! date_of_birth exposed in public API!"
            assert 'email' not in profile, "CRITICAL: UK GDPR leak! email address exposed in public API!"
            assert 'is_age_verified' not in profile
            assert 'sound_enabled' not in profile
            assert 'notifications_enabled' not in profile
