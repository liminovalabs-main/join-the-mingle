"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function BookingSuccessGenericContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
        <Check className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-navy mb-3">
        You&apos;re in!
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
        Your place is confirmed. We&apos;ve added you to the attendee roster and you&apos;ll find this mingle in My Mingler.
      </p>

      <div className="flex flex-col gap-3">
        {bookingId ? (
          <Link href={`/bookings/${bookingId}/success`}>
            <Button variant="coral" className="w-full rounded-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider">
              View Ticket &amp; Add to Calendar
            </Button>
          </Link>
        ) : (
          <Link href="/my-mingler">
            <Button variant="coral" className="w-full rounded-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider">
              Go to My Mingler
            </Button>
          </Link>
        )}
        <Link href="/browse">
          <Button variant="outline" className="w-full rounded-full h-12 text-xs sm:text-sm font-bold uppercase tracking-wider border-border text-brand-navy hover:text-brand-coral">
            Find more mingles
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessGenericPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading confirmation…</p>
        </div>
      }
    >
      <BookingSuccessGenericContent />
    </Suspense>
  );
}
