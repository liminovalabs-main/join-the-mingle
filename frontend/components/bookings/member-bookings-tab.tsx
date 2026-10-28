"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Ticket,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMyBookings, cancelBooking, downloadCalendarInvite } from "@/lib/api/bookings";
import { extractErrorMessage } from "@/lib/api/client";
import { getMingleImageUrl } from "@/lib/constants/images";
import { Booking } from "@/types/booking";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function MemberBookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const data = await getMyBookings({ page_size: 50 });
      setBookings(data.results || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleDownloadCalendar = async (b: Booking) => {
    setDownloadingId(b.id);
    try {
      await downloadCalendarInvite(b.id, `mingle-${b.mingle.id.slice(0, 8)}.ics`);
      toast.success("Calendar invitation downloaded!");
    } catch {
      toast.error("Could not download calendar invite. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancel(true);
    try {
      await cancelBooking(cancellingBooking.id, cancelReason);
      toast.success("Reservation cancelled. Reserved capacity has been released.");
      setCancellingBooking(null);
      setCancelReason("");
      await loadBookings();
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg || "Could not cancel booking. Please try again.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Loading your bookings…
        </p>
      </div>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "refunded") return false;
    const eventTime = new Date(`${b.mingle.event_date}T${b.mingle.start_time || "00:00:00"}`);
    return eventTime >= now;
  });

  const pastOrCancelledBookings = bookings.filter((b) => {
    if (b.status === "cancelled" || b.status === "refunded") return true;
    const eventTime = new Date(`${b.mingle.event_date}T${b.mingle.start_time || "00:00:00"}`);
    return eventTime < now;
  });

  return (
    <div className="space-y-10 text-left">
      {/* 1. Upcoming Experiences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-brand-navy">
            Upcoming Experiences ({upcomingBookings.length})
          </h2>
          <Link href="/browse">
            <Button
              variant="outline"
              className="rounded-full border-border text-xs font-bold uppercase tracking-wider text-brand-navy hover:text-brand-coral"
            >
              Browse Mingles
            </Button>
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-white p-10 text-center space-y-3">
            <Ticket className="w-10 h-10 text-brand-coral/60 mx-auto mb-2" />
            <h3 className="font-heading text-lg font-bold text-brand-navy">
              No Upcoming Reservations
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You haven&apos;t booked any upcoming mingles yet. Discover London cocktail masterclasses, supper clubs, and social dinners!
            </p>
            <div className="pt-2">
              <Link href="/browse">
                <Button variant="coral" className="rounded-full px-6 text-xs uppercase font-bold tracking-wider">
                  Find Your Next Mingle
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-3xl border border-border/70 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ref: #{b.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        b.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {b.status_display || b.status}
                    </span>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-brand-stone/20 shrink-0">
                      <Image
                        src={getMingleImageUrl(b.mingle.hero_image, b.mingle.experience_type)}
                        alt={b.mingle.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/mingles/${b.mingle.id}`}
                        className="font-heading text-base sm:text-lg font-bold text-brand-navy hover:text-brand-coral transition-colors line-clamp-1"
                      >
                        {b.mingle.title}
                      </Link>
                      {b.mingle.venue && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                          {b.mingle.venue.name}, {b.mingle.venue.area}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-border/50 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-navy shrink-0" />
                      <span className="font-medium text-brand-navy">{formatDate(b.mingle.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-navy shrink-0" />
                      <span className="font-medium text-brand-navy">{b.mingle.start_time?.slice(0, 5)}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground flex justify-between items-center">
                    <span>{b.places_booked} {b.places_booked === 1 ? "seat" : "seats"} booked</span>
                    <span className="font-bold text-brand-navy text-sm">£{parseFloat(b.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadCalendar(b)}
                    disabled={downloadingId === b.id}
                    className="rounded-full px-4 py-1.5 h-8 text-[11px] font-bold uppercase tracking-wider text-brand-navy border-border hover:text-brand-coral"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {downloadingId === b.id ? "Saving…" : "Calendar (.ics)"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCancellingBooking(b)}
                    className="rounded-full px-3 py-1.5 h-8 text-[11px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Past & Cancelled Experiences */}
      {pastOrCancelledBookings.length > 0 && (
        <div className="pt-6 border-t border-border/60">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-brand-navy mb-4">
            Past &amp; Cancelled History ({pastOrCancelledBookings.length})
          </h2>

          <div className="space-y-3">
            {pastOrCancelledBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-border/60 bg-brand-ivory/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-brand-navy">
                      {b.mingle.title}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        b.status === "cancelled"
                          ? "bg-stone-200 text-stone-700"
                          : "bg-brand-stone/30 text-brand-navy"
                      }`}
                    >
                      {b.status_display || b.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>{formatDate(b.mingle.event_date)}</span>
                    <span>&bull;</span>
                    <span>{b.places_booked} {b.places_booked === 1 ? "seat" : "seats"}</span>
                    <span>&bull;</span>
                    <span>£{parseFloat(b.total_amount).toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/mingles/${b.mingle.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider border-border"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Dialog
        open={!!cancellingBooking}
        onOpenChange={(open) => !open && setCancellingBooking(null)}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-heading text-xl font-bold text-brand-navy">
              Cancel Reservation?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Are you sure you want to cancel your reservation for{" "}
              <strong className="text-brand-navy">{cancellingBooking?.mingle?.title}</strong>? Your{" "}
              {cancellingBooking?.places_booked}{" "}
              {cancellingBooking?.places_booked === 1 ? "place" : "places"} will be immediately released to other members.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3">
            <label className="block text-xs font-semibold text-brand-navy mb-1.5">
              Reason for cancellation (optional):
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling unwell…"
              className="w-full rounded-xl border border-border/80 bg-white p-3 text-sm text-brand-navy focus:border-brand-coral focus:outline-none focus:ring-2 focus:ring-brand-coral/20"
            />
          </div>

          <DialogFooter className="mt-5 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancellingBooking(null)}
              className="rounded-full flex-1"
            >
              Keep My Reservation
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isSubmittingCancel}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white flex-1 font-bold text-xs uppercase tracking-wider"
            >
              {isSubmittingCancel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling…
                </>
              ) : (
                "Yes, Cancel Reservation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MemberBookingsTab;
