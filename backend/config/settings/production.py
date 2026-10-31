"""Production & Staging settings for Mingler project.

Extends base settings with security hardening, WhiteNoise static delivery,
Render cloud compatibility, and Vercel cross-origin authorization.
"""
import os
import re

from config.settings.base import *  # noqa: F401,F403

# ──────────────────────────────────────────────
# Security
# ──────────────────────────────────────────────
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-mringle-production-staging-secret-key-change-me',
)

# Render automatically provides RENDER_EXTERNAL_HOSTNAME (e.g. mringle-backend.onrender.com)
render_hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME')

raw_allowed_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]

if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)

# Default staging host entries if not explicitly provided
for default_host in ['.onrender.com', 'localhost', '127.0.0.1']:
    if default_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(default_host)

# ──────────────────────────────────────────────
# SSL / HTTPS
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1')
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ──────────────────────────────────────────────
# HSTS (HTTP Strict Transport Security)
# ──────────────────────────────────────────────
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 31536000))  # 1 year default
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ──────────────────────────────────────────────
# Content Security
# ──────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# ──────────────────────────────────────────────
# Static Files & WhiteNoise
# ──────────────────────────────────────────────
# WhiteNoise enables Gunicorn on Render to serve static files with compression & caching
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ──────────────────────────────────────────────
# CORS & CSRF — Support Vercel Deployments
# ──────────────────────────────────────────────
raw_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in raw_cors.split(',') if origin.strip()]

frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url and frontend_url not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(frontend_url)

# Ensure common default domains are present
for default_cors in ['https://mingler.co.uk', 'http://localhost:3000']:
    if default_cors not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(default_cors)

CORS_ALLOW_CREDENTIALS = True

# Regex matches all preview and production *.vercel.app deployment domains
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]

# CSRF Trusted Origins for Django Admin and session endpoints
raw_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in raw_csrf.split(',') if origin.strip()]

if render_hostname:
    CSRF_TRUSTED_ORIGINS.append(f'https://{render_hostname}')
if frontend_url and frontend_url.startswith('https://'):
    CSRF_TRUSTED_ORIGINS.append(frontend_url)

for default_csrf in [
    'https://*.onrender.com',
    'https://*.vercel.app',
    'https://mingler.co.uk',
]:
    if default_csrf not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(default_csrf)

# ──────────────────────────────────────────────
# Database — Parse DATABASE_URL (Render PostgreSQL)
# ──────────────────────────────────────────────
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(
        conn_max_age=60,
        conn_health_checks=True,
    )

# ──────────────────────────────────────────────
# Celery / Redis
# ──────────────────────────────────────────────
# For staging demos on Render without an active Redis service,
# enable synchronous eager execution to process email/match notifications.
if os.environ.get('CELERY_TASK_ALWAYS_EAGER', 'False').lower() in ('true', '1') or not os.environ.get('CELERY_BROKER_URL'):
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
