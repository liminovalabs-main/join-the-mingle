"""Service layer functions for the users app.

Handles email dispatch for verification codes and account notifications.
"""
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_verification_email(user, code: str) -> bool:
    """Send a 6-digit verification code email to the specified user."""
    subject = 'Verify your Mingler account — London'
    display_name = getattr(user, 'profile', None) and user.profile.display_name or 'there'

    plain_message = (
        f"Hi {display_name},\n\n"
        f"Welcome to Mingler — The Physical Social Network for London.\n\n"
        f"Your 6-digit email verification code is: {code}\n\n"
        f"This code will expire in 15 minutes.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\n"
        f"The Mingler Team\n"
        f"mingler.co.uk"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 40px 10px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e6df; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #142232; padding: 32px 24px; text-align: center;">
          <h1 style="color: #f7f6f2; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Mingler<span style="color: #ff5a5f;">.</span></h1>
          <p style="color: rgba(247,246,242,0.7); margin: 8px 0 0; font-size: 13px;">The Physical Social Network · London</p>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="color: #142232; margin: 0 0 12px; font-size: 20px;">Welcome, {display_name}!</h2>
          <p style="color: #555555; line-height: 1.6; font-size: 15px; margin: 0 0 24px;">
            Thank you for joining Mingler. Please use the 6-digit verification code below to confirm your email and activate your account:
          </p>
          <div style="background-color: #f7f6f2; border: 1px dashed #d0cec5; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff5a5f; font-family: monospace;">{code}</div>
            <div style="color: #888888; font-size: 12px; margin-top: 8px;">Valid for 15 minutes</div>
          </div>
          <p style="color: #777777; font-size: 13px; line-height: 1.5; margin: 0;">
            If you didn't create an account with Mingler, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #faf9f6; padding: 18px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999999; font-size: 11px; margin: 0;">© 2026 Mingler · London, UK · Curated Social Experiences</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info('Dispatched verification email to %s', user.email)
        return True
    except Exception as exc:
        logger.error('Failed to send verification email to %s: %s', user.email, exc)
        return False


def send_password_reset_email(user, code: str) -> bool:
    """Send a 6-digit password reset OTP email to the specified user."""
    subject = 'Reset your Mingler password — London'
    display_name = getattr(user, 'profile', None) and user.profile.display_name or 'there'

    plain_message = (
        f"Hi {display_name},\n\n"
        f"We received a request to reset the password for your Mingler account.\n\n"
        f"Your 6-digit password reset code is: {code}\n\n"
        f"This code will expire in 15 minutes.\n\n"
        f"If you did not request a password reset, please ignore this email. Your password will remain unchanged.\n\n"
        f"Best regards,\n"
        f"The Mingler Team\n"
        f"mingler.co.uk"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 40px 10px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e6df; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #142232; padding: 32px 24px; text-align: center;">
          <h1 style="color: #f7f6f2; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Mingler<span style="color: #ff5a5f;">.</span></h1>
          <p style="color: rgba(247,246,242,0.7); margin: 8px 0 0; font-size: 13px;">The Physical Social Network · London</p>
        </div>
        <div style="padding: 36px 32px;">
          <h2 style="color: #142232; margin: 0 0 12px; font-size: 20px;">Password Reset Request</h2>
          <p style="color: #555555; line-height: 1.6; font-size: 15px; margin: 0 0 24px;">
            Hello {display_name}, we received a request to reset your password. Use the 6-digit code below to set a new password:
          </p>
          <div style="background-color: #f7f6f2; border: 1px dashed #d0cec5; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff5a5f; font-family: monospace;">{code}</div>
            <div style="color: #888888; font-size: 12px; margin-top: 8px;">Valid for 15 minutes</div>
          </div>
          <p style="color: #777777; font-size: 13px; line-height: 1.5; margin: 0;">
            If you did not request this password reset, you can safely ignore this email. Your current password remains secure.
          </p>
        </div>
        <div style="background-color: #faf9f6; padding: 18px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999999; font-size: 11px; margin: 0;">© 2026 Mingler · London, UK · Curated Social Experiences</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info('Dispatched password reset email to %s', user.email)
        return True
    except Exception as exc:
        logger.error('Failed to send password reset email to %s: %s', user.email, exc)
        return False
