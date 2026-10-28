"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar,
  Check,
  Clock,
  Download,
  MapPin,
  Sparkles,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getBooking, downloadCalendarInvite } from "@/lib/api/bookings";
import { getMingleImageUrl } from "@/lib/constants/images";
import { Booking } from "@/types/booking";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function BookingSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingIcs, setDownloadingIcs] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    let isMounted = true;
    setLoading(true);

    getBooking(bookingId)
      .then((data) => {
        if (isMounted) setBooking(data);
      })
      .catch(() => {
        if (isMounted) setBooking(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleDownloadCalendar = async () => {
    if (!booking) return;
    setDownloadingIcs(true);
    try {
      await downloadCalendarInvite(booking.id, `mingle-${booking.mingle.id.slice(0, 8)}.ics`);
      toast.success("Calendar invitation (.ics) downloaded!");
    } catch {
      toast.error("Could not download calendar invite. Please try again.");
    } finally {
      setDownloadingIcs(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">
          Confirming your booking details…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12 md:py-16 text-center">
      {/* Celebration Check Icon (Base44 Fidelity) */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
        <Check className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-navy">
        You&apos;re in!
      </h1>
      <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
        Your place is confirmed. We&apos;ve added you to the attendee roster and sent a receipt and calendar invitation to your email.
      </p>

      {/* Booking Snapshot Card */}
      {booking && (
        <div className="mt-8 rounded-3xl border border-border/70 bg-white p-6 sm:p-8 shadow-xs text-left">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Ticket className="w-4 h-4 text-brand-coral" /> Ref: #{booking.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700">
              Confirmed
            </span>
          </div>

          <div className="mt-5 flex gap-4 items-start">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-brand-stone/20 shrink-0">
              <Image
                src={getMingleImageUrl(booking.mingle.hero_image, booking.mingle.experience_type)}
                alt={booking.mingle.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-brand-navy line-clamp-2">
                {booking.mingle.title}
              </h2>
              {booking.mingle.venue && (
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-coral" />
                  {booking.mingle.venue.name}, {booking.mingle.venue.area}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-brand-navy">
              <Calendar className="w-4 h-4 text-brand-coral shrink-0" />
              <span>{formatDate(booking.mingle.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-navy">
              <Clock className="w-4 h-4 text-brand-coral shrink-0" />
              <span>{booking.mingle.start_time?.slice(0, 5)} ({booking.mingle.duration_minutes || 120} mins)</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center text-sm font-semibold">
            <span className="text-muted-foreground">
              {booking.places_booked} {booking.places_booked === 1 ? "place" : "places"} reserved
            </span>
            <span className="text-brand-navy font-bold text-base">
              Total: £{parseFloat(booking.total_amount).toFixed(2)}
            </span>
          </div>

          {/* Add to Calendar Action */}
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadCalendar}
              disabled={downloadingIcs}
              className="w-full rounded-2xl border-border py-2.5 text-xs sm:text-sm font-bold text-brand-navy hover:text-brand-coral"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingIcs ? "Downloading Calendar Invite…" : "Add to Calendar (.ics)"}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/my-mingler" className="flex-1">
          <Button
            variant="coral"
            className="w-full h-12 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-brand-coral/20"
          >
            Go to My Mingler
          </Button>
        </Link>
        <Link href="/browse" className="flex-1">
          <Button
            variant="outline"
            className="w-full h-12 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border-border text-brand-navy hover:text-brand-coral"
          >
            Find More Mingles
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading confirmation…
          </p>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
