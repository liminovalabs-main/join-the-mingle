"""Celery application configuration for Mingler.

Initializes the Celery app and enables auto-discovery of
task modules across all registered Django apps.
"""
import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

app = Celery('mingler')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
