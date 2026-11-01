"""Management command to create or update a superuser non-interactively.

Useful for cloud environments like Render Free Tier where interactive shell access
is unavailable. Reads credentials from DJANGO_SUPERUSER_EMAIL and
DJANGO_SUPERUSER_PASSWORD environment variables or CLI options.
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create or update superuser non-interactively using environment variables or arguments.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Superuser email address.')
        parser.add_argument('--password', type=str, help='Superuser password.')

    def handle(self, *args, **options):
        email = options.get('email') or os.environ.get('DJANGO_SUPERUSER_EMAIL')
        password = options.get('password') or os.environ.get('DJANGO_SUPERUSER_PASSWORD')

        if not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    'initadmin: DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set. Skipping.'
                )
            )
            return

        User = get_user_model()
        user = User.objects.filter(email=email).first()

        if user:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.role = 'admin'
            user.is_active = True
            user.is_email_verified = True
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f'initadmin: Successfully updated credentials for existing superuser: {email}'
                )
            )
        else:
            User.objects.create_superuser(
                email=email,
                password=password,
                role='admin',
                is_active=True,
                is_email_verified=True,
            )
            self.stdout.write(
                self.style.SUCCESS(f'initadmin: Successfully created new superuser: {email}')
            )
