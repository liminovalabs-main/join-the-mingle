"""Custom user manager for email-based authentication."""
from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    """Manager for the custom User model that uses email as the unique identifier."""

    def create_user(self, email: str, password: str = None, **extra_fields):
        """Create and return a regular user with the given email and password."""
        if not email:
            raise ValueError('Users must have an email address.')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', False)
        extra_fields.setdefault('is_email_verified', False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str = None, **extra_fields):
        """Create and return a superuser with admin privileges."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
