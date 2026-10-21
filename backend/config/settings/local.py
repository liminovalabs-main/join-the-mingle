"""Local development settings for Mingler project.

Extends base settings with development-friendly configuration.
Enables BrowsableAPI renderer, debug toolbar, and console email backend.
"""
from config.settings.base import *  # noqa: F401,F403

# ──────────────────────────────────────────────
# Debug Mode
# ──────────────────────────────────────────────
DEBUG = True

# ──────────────────────────────────────────────
# Add BrowsableAPI for development
# ──────────────────────────────────────────────
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

# ──────────────────────────────────────────────
# Email Configuration
# ──────────────────────────────────────────────
# If real SMTP credentials are provided in .env, send actual emails via Gmail/SMTP.
# Otherwise, default to printing emails directly to the console for convenient local testing.
if os.environ.get('EMAIL_BACKEND'):
    EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND')
elif (
    os.environ.get('EMAIL_HOST_USER')
    and os.environ.get('EMAIL_HOST_PASSWORD')
    and os.environ.get('EMAIL_HOST_USER') not in ('', 'your-email@gmail.com')
):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ──────────────────────────────────────────────
# CORS — Allow all origins in development
# ──────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ──────────────────────────────────────────────
# Disable throttling in development
# ──────────────────────────────────────────────
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = ()
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}

# ──────────────────────────────────────────────
# Optional SQLite for host testing without Docker
# ──────────────────────────────────────────────
if os.environ.get('USE_SQLITE', 'False').lower() in ('true', '1'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ──────────────────────────────────────────────
# Celery Local Development & Test Execution
# ──────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'


