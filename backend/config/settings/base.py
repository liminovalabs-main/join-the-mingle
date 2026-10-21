"""Base settings for Mingler project.

Common configuration shared across all environments.
Environment-specific overrides go in local.py or production.py.
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-mingler-london-super-secret-key-development-2026-strict-key',
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ──────────────────────────────────────────────
# Application Definition
# ──────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'django_celery_beat',
    'storages',
]

LOCAL_APPS = [
    'apps.core',
    'apps.users',
    'apps.venues',
    'apps.mingles',
    'apps.bookings',
    'apps.payments',
    'apps.interactions',
    'apps.notifications',
    'apps.administration',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ──────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ──────────────────────────────────────────────
# Database (PostgreSQL)
# ──────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'mingler_db'),
        'USER': os.environ.get('POSTGRES_USER', 'mingler_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'mingler_pass'),
        'HOST': os.environ.get('POSTGRES_HOST', 'db'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'ATOMIC_REQUESTS': True,
        'CONN_MAX_AGE': 60,
    }
}

# ──────────────────────────────────────────────
# Custom User Model
# ──────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ──────────────────────────────────────────────
# Password Validation
# ──────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ──────────────────────────────────────────────
# Internationalization
# ──────────────────────────────────────────────
LANGUAGE_CODE = 'en-gb'
TIME_ZONE = 'Europe/London'
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────────
# Static & Media Files
# ──────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ──────────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',
        'user': '120/minute',
    },
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# ──────────────────────────────────────────────
# SimpleJWT Configuration
# ──────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 15))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────
# Celery Configuration
# ──────────────────────────────────────────────
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/1')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300  # 5 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 240  # 4 minutes soft limit

# ──────────────────────────────────────────────
# Stripe
# ──────────────────────────────────────────────
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# ──────────────────────────────────────────────
# Email
# ──────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Mingler <hello@mingler.co.uk>')

# ──────────────────────────────────────────────
# Cloudflare R2 (S3-compatible Media Storage)
# ──────────────────────────────────────────────
if os.environ.get('CLOUDFLARE_R2_ACCESS_KEY_ID'):
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.environ.get('CLOUDFLARE_R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('CLOUDFLARE_R2_BUCKET_NAME', 'mingler-media')
    AWS_S3_ENDPOINT_URL = os.environ.get('CLOUDFLARE_R2_ENDPOINT_URL')
    AWS_S3_CUSTOM_DOMAIN = os.environ.get('CLOUDFLARE_R2_CUSTOM_DOMAIN')
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_QUERYSTRING_AUTH = False

# ──────────────────────────────────────────────
# OAuth2 Social Authentication (Google, Apple, Facebook, Instagram, TikTok, LinkedIn)
# ──────────────────────────────────────────────
SOCIAL_AUTH_CONFIG = {
    'google': {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
    },
    'apple': {
        'client_id': os.environ.get('APPLE_CLIENT_ID', ''),
        'team_id': os.environ.get('APPLE_TEAM_ID', ''),
        'key_id': os.environ.get('APPLE_KEY_ID', ''),
        'private_key': os.environ.get('APPLE_PRIVATE_KEY', ''),
    },
    'facebook': {
        'client_id': os.environ.get('FACEBOOK_CLIENT_ID', ''),
        'client_secret': os.environ.get('FACEBOOK_CLIENT_SECRET', ''),
    },
    'instagram': {
        'client_id': os.environ.get('INSTAGRAM_CLIENT_ID', ''),
        'client_secret': os.environ.get('INSTAGRAM_CLIENT_SECRET', ''),
    },
    'tiktok': {
        'client_key': os.environ.get('TIKTOK_CLIENT_KEY', ''),
        'client_secret': os.environ.get('TIKTOK_CLIENT_SECRET', ''),
    },
    'linkedin': {
        'client_id': os.environ.get('LINKEDIN_CLIENT_ID', ''),
        'client_secret': os.environ.get('LINKEDIN_CLIENT_SECRET', ''),
    },
}

# ──────────────────────────────────────────────
# DRF Spectacular (OpenAPI / Swagger)
# ──────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'Mingler API',
    'DESCRIPTION': 'Curated Social Experiences Platform — London',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'ENUM_NAME_OVERRIDES': {
        'SocialProviderEnum': 'apps.users.models.SocialAccount.PROVIDER_CHOICES',
        'VenueStatusEnum': 'apps.venues.models.Venue.STATUS_CHOICES',
        'MingleStatusEnum': 'apps.mingles.models.Mingle.STATUS_CHOICES',
        'BookingStatusEnum': 'apps.bookings.models.Booking.STATUS_CHOICES',
    },
}

# ──────────────────────────────────────────────
# Default Primary Key Type
# ──────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
