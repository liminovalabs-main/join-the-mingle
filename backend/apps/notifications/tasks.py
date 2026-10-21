"""Celery asynchronous tasks for Project Mingler notifications."""
import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from apps.bookings.models import Booking
from apps.interactions.models import Connection
from apps.notifications.calendar import CalendarService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_booking_confirmation_email_task(self, booking_id: str) -> bool:
    """Dispatches a booking confirmation email with attached .ics calendar invite.

    Args:
        booking_id: UUID string of the confirmed Booking.
    """
    try:
        booking = Booking.objects.select_related('profile__user', 'mingle__venue').get(id=booking_id)
        user = booking.profile.user
        mingle = booking.mingle
        venue = mingle.venue

        subject = f"Booking Confirmed: {mingle.title} 🎟️"
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Mingler <hello@mingler.co.uk>')
        recipient = user.email

        event_date_str = mingle.event_date.strftime('%A, %d %B %Y')
        event_time_str = mingle.start_time.strftime('%H:%M')
        venue_address = f"{venue.name}, {venue.address}, {venue.postcode}" if venue else "London, UK"

        text_content = f"""
Hello {booking.profile.display_name},

Your reservation for {mingle.title} is confirmed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPERIENCE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event: {mingle.title}
Date: {event_date_str}
Time: {event_time_str} ({mingle.duration_minutes} mins)
Location: {venue_address}
Seats Reserved: {booking.places_booked}
Total Amount Paid: £{booking.total_amount} GBP
Booking Reference: #{str(booking.id)[:8]}

We have attached an iCalendar (.ics) invite to this email so you can add this experience to Google Calendar, Apple Calendar, or Outlook with one tap.

See you there!
The Mingler Team
https://mingler.co.uk
        """.strip()

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 30px; color: #111827; }}
            .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .header {{ background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
            .badge {{ display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; }}
            .content {{ padding: 32px; }}
            .info-box {{ background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .info-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }}
            .info-label {{ color: #6b7280; font-weight: 500; }}
            .info-value {{ color: #111827; font-weight: 600; text-align: right; }}
            .cta {{ display: block; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; margin: 24px 0 12px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">Confirmed</span>
              <h1>You're Going to Mingler!</h1>
              <p style="margin: 0; opacity: 0.85;">Reference #{str(booking.id)[:8]}</p>
            </div>
            <div class="content">
              <p>Hi <strong>{booking.profile.display_name}</strong>,</p>
              <p>Get ready for a curated evening of great vibes and new connections in London.</p>

              <div class="info-box">
                <div class="info-row"><span class="info-label">Experience:</span><span class="info-value">{mingle.title}</span></div>
                <div class="info-row"><span class="info-label">Date & Time:</span><span class="info-value">{event_date_str} @ {event_time_str}</span></div>
                <div class="info-row"><span class="info-label">Venue:</span><span class="info-value">{venue_address}</span></div>
                <div class="info-row"><span class="info-label">Places:</span><span class="info-value">{booking.places_booked} guest(s)</span></div>
                <div class="info-row" style="margin-bottom:0;"><span class="info-label">Amount Paid:</span><span class="info-value">£{booking.total_amount} GBP</span></div>
              </div>

              <p style="font-size: 13px; color: #4b5563;">
                📅 <strong>Calendar invite attached:</strong> Tap the attached <code>mingle-invitation.ics</code> file to immediately add this event to Apple Calendar, Google Calendar, or Outlook.
              </p>

              <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/bookings" class="cta">View My Booking on Mingler</a>
            </div>
            <div class="footer">
              Mingler London &bull; Curated Social Experiences &bull; <a href="https://mingler.co.uk" style="color:#6b7280;">mingler.co.uk</a>
            </div>
          </div>
        </body>
        </html>
        """.strip()

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient],
        )
        msg.attach_alternative(html_content, "text/html")

        # Attach standard RFC 5545 .ics invite
        ics_data = CalendarService.generate_ics(booking)
        msg.attach(
            filename="mingle-invitation.ics",
            content=ics_data,
            mimetype="text/calendar; method=REQUEST; charset=UTF-8",
        )

        msg.send(fail_silently=False)
        logger.info("Dispatched booking confirmation email and .ics attachment to %s for Booking %s", recipient, booking.id)
        return True

    except Exception as exc:
        logger.exception("Failed to dispatch confirmation email for Booking %s: %s", booking_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_mutual_match_notification_task(self, connection_id: str) -> bool:
    """Notifies two members when a mutual match is formed after a Mingle.

    Args:
        connection_id: UUID string of the newly created Connection.
    """
    try:
        connection = Connection.objects.select_related(
            'mingle',
            'profile_a__user',
            'profile_b__user',
        ).get(id=connection_id)

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Mingler <hello@mingler.co.uk>')
        mingle_title = connection.mingle.title

        for profile, matched_profile in [
            (connection.profile_a, connection.profile_b),
            (connection.profile_b, connection.profile_a),
        ]:
            subject = f"It's a Mutual Match from {mingle_title}! ✨"
            recipient = profile.user.email

            text_content = f"""
Hello {profile.display_name},

Great news! You and {matched_profile.display_name} both selected each other after {mingle_title}!

Log in to Mingler to view their verified social profile and keep the conversation going:
{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/connections

Cheers,
The Mingler Team
            """.strip()

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[recipient],
            )
            msg.send(fail_silently=True)

        logger.info("Dispatched mutual match alert to profiles %s and %s for Connection %s", connection.profile_a.id, connection.profile_b.id, connection.id)
        return True
    except Exception as exc:
        logger.exception("Failed to dispatch mutual match notification for Connection %s: %s", connection_id, exc)
        raise self.retry(exc=exc)
