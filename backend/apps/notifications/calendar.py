"""iCalendar (RFC 5545) .ics file generator for Project Mingler reservations."""
from datetime import datetime, timedelta
import zoneinfo
from apps.bookings.models import Booking


class CalendarService:
    """Generates standard RFC 5545 iCalendar invitations (.ics) for confirmed bookings."""

    @classmethod
    def generate_ics(cls, booking: Booking) -> str:
        """Build an .ics formatted calendar event string for a confirmed Booking.

        Args:
            booking: The Booking model instance.

        Returns:
            RFC 5545 formatted .ics file text content.
        """
        mingle = booking.mingle
        venue = mingle.venue

        # Combine date and start time in Europe/London timezone
        london_tz = zoneinfo.ZoneInfo("Europe/London")
        start_naive = datetime.combine(mingle.event_date, mingle.start_time)
        start_local = start_naive.replace(tzinfo=london_tz)
        start_utc = start_local.astimezone(zoneinfo.ZoneInfo("UTC"))

        duration = timedelta(minutes=mingle.duration_minutes)
        end_utc = start_utc + duration
        now_utc = datetime.now(zoneinfo.ZoneInfo("UTC"))

        dtstamp = now_utc.strftime("%Y%m%dT%H%M%SZ")
        dtstart = start_utc.strftime("%Y%m%dT%H%M%SZ")
        dtend = end_utc.strftime("%Y%m%dT%H%M%SZ")

        location = f"{venue.name}, {venue.address}, {venue.postcode}, London" if venue else "London, UK"
        summary = mingle.title
        description = (
            f"Mingler London Experience: {mingle.title}\\n"
            f"Guests: {booking.places_booked} place(s)\\n"
            f"Venue: {location}\\n"
            f"Booking Reference: #{str(booking.id)[:8]}\\n"
            f"Total Paid: £{booking.total_amount}\\n\\n"
            f"We look forward to hosting you!"
        )

        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Mingler London//Curated Social Experiences//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            f"UID:mingle-{booking.id}@mingler.co.uk",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            f"ORGANIZER;CN=Mingler London:mailto:hello@mingler.co.uk",
            f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN={booking.profile.display_name}:mailto:{booking.profile.user.email}",
            "BEGIN:VALARM",
            "TRIGGER:-PT2H",
            "ACTION:DISPLAY",
            f"DESCRIPTION:Reminder: {summary} starts in 2 hours",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR",
        ]
        return "\r\n".join(ics_lines) + "\r\n"
