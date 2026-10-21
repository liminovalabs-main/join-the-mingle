"""Production settings for Mingler project.

Extends base settings with security hardening, SSL enforcement,
and HSTS headers required for mingler.co.uk deployment.
"""
import os

from config.settings.base import *  # noqa: F401,F403

# ──────────────────────────────────────────────
# Security
# ──────────────────────────────────────────────
DEBUG = False
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')

# ──────────────────────────────────────────────
# SSL / HTTPS
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ──────────────────────────────────────────────
# HSTS (HTTP Strict Transport Security)
# ──────────────────────────────────────────────
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ──────────────────────────────────────────────
# Content Security
# ──────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# ──────────────────────────────────────────────
# CORS — Restrict to production frontend domain
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 'https://mingler.co.uk'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────
# Database — Use DATABASE_URL if available
# ──────────────────────────────────────────────
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(
        conn_max_age=60,
        conn_health_checks=True,
    )
