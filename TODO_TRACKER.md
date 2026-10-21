# Project Mingler: Engineering Progress Tracker & Task Register

**Project:** Mingler (`mingler.co.uk`) — Full-Stack Rebuild  
**Status:** Phase 2 (Construction) — Sub-phase 2.3 (Source Code Implementation & Verification)  
**Current Activity:** Email Verification Flow & Auth (23/23 Passing)  
**Last Updated:** October 2026  

---

## 📊 High-Level Milestone Overview

| Part | Scope / Milestone | Target Architecture | Implementation State | Verification / Test State |
|---|---|---|---|---|
| **Part 1** | **Foundation, Docker & 3NF Schema** | Docker, Postgres 16, Redis, Celery, 9 Apps & 3NF Models | ✅ Complete | ✅ **Passed** (All migrations applied, model constraints tested) |
| **Part 2** | **Authentication, Email OTP & UK GDPR Privacy** | SimpleJWT, 6-Digit Email OTP, Public vs Private Profiles | ✅ Complete | ✅ **Passed** (23/23 Pytest tests, zero privacy leaks) |
| **Part 3** | **Catalog, Dynamic Roster & Concurrency Booking** | Dynamic Attendees, `select_for_update()` lock, Date Guard | ⏳ Ready to Start | ⏳ Queued next |
| **Part 4** | **Stripe Payments, Webhooks & Mutual Matching** | Idempotency Replay Guard, Mutual Match Engine, Celery Tasks | ⏳ Queued | ⏳ Awaiting Part 3 |
| **Part 5** | **Automated Testing & IaC Deployment Gate** | Full Pytest Suite, Docker integration, Render/VPS staging | ⏳ Queued | ⏳ Awaiting Part 4 |

---

## 📝 Detailed Task Register

### ✅ Part 1: Foundation, Docker Infrastructure & 3NF Database Schema
- [x] Create multi-stage `Dockerfile` (base stage for dev, production stage with Gunicorn).
- [x] Configure multi-container `docker-compose.yml` (`web`, `celery-worker`, `celery-beat`, `redis`, `db`).
- [x] Create environment config template (`.env.example`) and `.gitignore`.
- [x] Configure Django 5.1 project (`config/settings/base.py`, `local.py`, `production.py`).
- [x] Configure root URL router (`config/urls.py`) with Swagger/OpenAPI (`drf-spectacular`).
- [x] Configure Celery application with auto-discovery (`config/celery.py`, `config/__init__.py`).
- [x] Create core abstraction app (`apps.core`) with `BaseModel` (UUID + auto timestamps).
- [x] Create `apps.core.permissions` (RBAC: `IsPlatformAdmin`, `IsVenueManager`, `IsOwnerOrAdmin`).
- [x] Create `apps.core.pagination` (`StandardResultsPagination`) and `apps.core.exceptions` (standard JSON error envelope).
- [x] Implement 3NF models across all domains:
  - `apps.users`: Custom `User` (email-based, roles: `member`, `venue_manager`, `admin`, `is_email_verified`), `Profile`, `EmailVerificationCode`.
  - `apps.venues`: `Venue` (with slug, status, and direct upload `hero_image` ImageField), `VenueOpeningHour` (validated `TimeField`), `VenueMember`.
  - `apps.mingles`: `Mingle` (with lifecycle: draft → approved → published, and direct upload `hero_image` ImageField).
  - `apps.bookings`: `Booking` (with check constraint `places_booked` 1–5).
  - `apps.payments`: `Payment` (Stripe session/intent IDs) and `StripePaymentEvent` (idempotency log).
  - `apps.interactions`: `MingleSelection`, `Connection`, `Feedback`, `VenueReview`.
  - `apps.administration`: `PlatformSetting` (with JSON audit log).
  - `apps.notifications`: Celery mail worker scaffold.
- [x] Register all models with Django Admin.

---

### ✅ Part 2: Authentication, Email Verification & Password Reset
- [x] Configure virtual environment (`venv`) and `.env`.
- [x] Implement `UserRegistrationSerializer` with password validation, automatic profile binding, 6-digit OTP generation, and transactional email dispatch.
- [x] Implement `UserLoginSerializer` issuing JWT tokens with embedded claims (`user_id`, `role`, `is_email_verified`).
- [x] Implement `VerifyEmailSerializer` validating 6-digit OTP, checking expiration (15 mins), and marking `user.is_email_verified = True` & `user.is_active = True`.
- [x] Implement `ResendVerificationSerializer` with a 60-second cooldown rate limit to prevent email spamming.
- [x] Implement transactional HTML & plaintext email templates in `apps.users.services.send_verification_email`.
- [x] Implement Password Reset Flow via 6-digit OTP:
  - `PasswordResetCode` model with 15-minute expiration and invalidation of old codes.
  - `send_password_reset_email` service with London Mingler branded HTML & text template.
  - `PasswordResetRequestView` (`POST /api/v1/auth/password-reset/request/`).
  - `PasswordResetVerifyCodeView` (`POST /api/v1/auth/password-reset/verify-code/`).
  - `PasswordResetConfirmView` (`POST /api/v1/auth/password-reset/confirm/`) with Django password validator enforcement.
- [x] Implement `PrivateProfileSerializer` (owner/admin only) with 18+ age verification check and `is_email_verified` visibility.
- [x] Implement `PublicProfileSerializer` (**UK GDPR Compliance**: strictly strips `date_of_birth` and `email` to prevent PII exposure).
- [x] Implement social profile regex validation (Instagram handle & LinkedIn URL format).
- [x] Create Auth views: `RegisterView`, `VerifyEmailView`, `ResendVerificationCodeView`, `PasswordResetRequestView`, `PasswordResetVerifyCodeView`, `PasswordResetConfirmView`, `LoginView`, `LogoutView` (token blacklisting).
- [x] Create Profile views: `MyProfileView` (`GET`/`PATCH /api/v1/profiles/me/`), `PublicProfileListView` (`GET /api/v1/profiles/public/?ids=...`).
- [x] Implement direct device image file upload (`models.ImageField`) with `MultiPartParser` support.
- [x] Wire up routes in `apps/users/urls/auth_urls.py` and `apps/users/urls/profile_urls.py`.

---

### ✅ Part 1 & Part 2 Verification Results (28/28 Passed — 100%)
- [x] Python dependencies installed in `venv` (`requirements/local.txt`).
- [x] Django system check clean (`python manage.py check` -> 0 issues).
- [x] Database migrations generated & applied cleanly across all 9 apps (`users.0003`, `users.0004`, `users.0005` included).
- [x] Automated Pytest test suite (`tests/test_part1_models.py`, `tests/test_part2_auth_gdpr.py`):
  - [x] `test_user_creation_triggers_profile_signal`: Auto Profile creation on user signup.
  - [x] `test_venue_slug_auto_generation`: Venue slug generation on save.
  - [x] `test_venue_opening_hours_structure`: TimeField validation for hours.
  - [x] `test_mingle_lifecycle_and_foreign_keys`: Mingle lifecycle defaults to draft.
  - [x] `test_booking_places_range_constraint`: Booking places range enforcement (1-5).
  - [x] `test_stripe_payment_event_uniqueness`: Stripe replay attack prevention via unique event ID.
  - [x] `test_platform_setting_audit_log`: JSON platform settings versioning.
  - [x] `test_member_registration_success`: Registration creates inactive/unverified account without tokens.
  - [x] `test_member_registration_password_mismatch`: Registration rejection on password mismatch.
  - [x] `test_member_login_success`: Login credential check & token return for active/verified users.
  - [x] `test_member_logout_blacklists_token`: Blacklisting refresh tokens on logout.
  - [x] `test_registration_generates_verification_code_and_dispatches_email`: Automatic 6-digit OTP creation and transactional email dispatch.
  - [x] `test_verify_email_success`: Valid 6-digit code marks `is_email_verified=True`, `is_active=True`, and issues fresh tokens.
  - [x] `test_unverified_member_login_is_blocked`: Unverified login attempts are blocked with 400 Bad Request until OTP verification.
  - [x] `test_verify_email_invalid_code`: Rejection of wrong 6-digit codes.
  - [x] `test_verify_email_expired_code`: Rejection of expired OTP codes.
  - [x] `test_resend_verification_cooldown_and_success`: 60s cooldown enforcement and new OTP generation.
  - [x] `test_resend_verification_already_verified`: Rejection of resends for already verified accounts.
  - [x] `test_password_reset_request_dispatches_email`: Request creates OTP and sends email; anti-enumeration safe.
  - [x] `test_password_reset_verify_code`: Validates OTP code before showing password change form.
  - [x] `test_password_reset_confirm_updates_password_and_allows_login`: New password applied and old password invalidated.
  - [x] `test_password_reset_expired_or_used_code_rejected`: Rejection of expired or already consumed reset codes.
  - [x] `test_get_my_private_profile`: Authenticated retrieval of private profile.
  - [x] `test_update_my_profile_and_socials`: Patching profile bio, socials, and display name.
  - [x] `test_upload_profile_photo_multipart`: Direct image file upload via multipart/form-data.
  - [x] `test_age_guard_rejects_under_18`: Strict rejection of underage profiles (< 18).
  - [x] `test_social_url_regex_validation`: Strict validation of Instagram/LinkedIn formats.
  - [x] `test_uk_gdpr_public_profile_sanitization`: **Zero PII leakage** (DOB & email never exposed publicly).

---

### ⏳ Part 3: Catalog, Dynamic Roster & Concurrency Booking Engine
- [ ] Implement `apps/venues/serializers.py` & `views.py` (filter by area/category, live ratings).
- [ ] Implement `apps/mingles/serializers.py` & `views.py` (filter by date, experience type, seats remaining).
- [ ] Implement dynamic "Who's Going" endpoint (`GET /api/v1/mingles/{id}/attendees/`) backed by live confirmed bookings (**Defect #5 fix**).
- [ ] Implement `apps/bookings/services.py` with `select_for_update()` atomic capacity locking.
- [ ] Implement past-event date guard rejecting bookings after event date (**Defect #3 fix**).
- [ ] Implement user booking history endpoint (`GET /api/v1/bookings/my-bookings/`).

---

### ⏳ Part 4: Stripe Payments, Webhooks & Mutual Matching
- [ ] Implement Stripe Checkout Session initiation (`POST /api/v1/bookings/initiate/`).
- [ ] Implement signed webhook receiver (`POST /api/v1/payments/webhook/`) with `StripePaymentEvent` replay protection.
- [ ] Implement After-Mingle review submission with attendance verification permission (`HasConfirmedAttendance`) (**Defect #4 fix**).
- [ ] Implement mutual matching algorithm (`evaluate_mutual_connections`).
- [ ] Implement Celery notification tasks (booking confirmation email + `.ics` calendar file, celebration email).
- [ ] 🛑 **AI-DLC Phase 2.3 Gating Point**: Core implementation review with user.

---

### ⏳ Part 5: Automated Testing, IaC & Staging Readiness
- [ ] End-to-end integration test suite.
- [ ] Concurrency test simulating simultaneous booking on last available seat.
- [ ] Finalize Docker builds and verify healthchecks.
- [ ] 🛑 **AI-DLC Phase 2.5 Gating Point**: User approval before Phase 3 Operation.

---

## 📌 Session Handover & Resumption Guide

### Summary of Completed Work (Parts 1 & 2):
1. **Infrastructure & Database:**
   - Multi-container Docker compose (`db` Postgres 16 on 5432, `redis` 7.2 on 6379, `web`, Celery workers).
   - 9 domain apps created with strict 3NF models, UUID primary keys, and auto-timestamps.
   - Migrations `users.0001`, `users.0002`, `users.0003` fully applied to Postgres.
   - Demo seed data populated with 5 London venues and 6 mingles.
   - Upgraded `Profile.photo`, `Venue.hero_image`, and `Mingle.hero_image` to `models.ImageField` with `MultiPartParser` support.
2. **Authentication, Profiles & UK GDPR Privacy Guard:**
   - SimpleJWT authentication with access (15m) & refresh (7d) tokens, token rotation, and logout token blacklisting.
   - 18+ age validation on private profile update (`validate_date_of_birth`).
   - UK GDPR zero PII leak guarantee: `PublicProfileSerializer` never exposes date of birth or email address.
   - 6-digit OTP Email Verification flow (`EmailVerificationCode`, auto-dispatch on signup, `/verify-email/`, 60-second rate-limited `/resend-verification/`).
   - Dual email delivery modes: automatic console logging for local dev + live Gmail SMTP delivery using `.env` App Password.
3. **Verification & Quality:**
   - Automated Pytest test suite: **23/23 tests passing (100% pass rate)**.
   - Postman Collection (`postman_collection.json`) updated with all 11 endpoints and token scripts.

### 🎯 Immediate Priority on Resumption (Part 3):
When resuming, jump straight into **Part 3: Catalog, Dynamic Roster & Concurrency Booking Engine**:
1. Implement `apps/venues/serializers.py` & `views.py` (`GET /api/v1/venues/` and `GET /api/v1/venues/{id}/` with area & category filters).
2. Implement `apps/mingles/serializers.py` & `views.py` (`GET /api/v1/mingles/` with date/price/experience filtering and dynamic remaining seats calculation).
3. Implement dynamic "Who's Going" endpoint (`GET /api/v1/mingles/{id}/attendees/`) backed by live confirmed bookings (fixes Base44 Defect #5).
4. Implement `apps/bookings/services.py` with `select_for_update()` atomic capacity locking to prevent overbooking races.
5. Implement past-event date guard rejecting bookings after event date (fixes Base44 Defect #3).
6. Implement user booking history endpoint (`GET /api/v1/bookings/my-bookings/`).
7. Write Part 3 Pytest unit tests in `backend/tests/test_part3_catalog_bookings.py`.
