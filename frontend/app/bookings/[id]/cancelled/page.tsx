"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBooking } from "@/lib/api/bookings";
import { Booking } from "@/types/booking";

function BookingCancelledContent() {
  const params = useParams();
  const bookingId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((data) => setBooking(data))
      .catch(() => setBooking(null));
  }, [bookingId]);

  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-sm">
        <XCircle className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2]" />
      </div>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-brand-navy mb-2">
        Checkout Cancelled
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
        Your payment was not completed and no funds were deducted. Your pending reservation has been safely cancelled.
      </p>

      <div className="flex flex-col gap-3">
        {booking?.mingle?.id && (
          <Link href={`/checkout/${booking.mingle.id}`}>
            <Button variant="coral" className="w-full rounded-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Booking Again
            </Button>
          </Link>
        )}
        <Link href="/browse">
          <Button variant="outline" className="w-full rounded-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider border-border text-brand-navy hover:text-brand-coral">
            <ArrowLeft className="w-4 h-4 mr-2" /> Browse Other Mingles
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <BookingCancelledContent />
    </Suspense>
  );
}
