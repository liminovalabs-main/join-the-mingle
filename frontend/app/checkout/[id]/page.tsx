"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getMingle } from "@/lib/api/mingles";
import { createBooking, createCheckoutSession } from "@/lib/api/bookings";
import { extractErrorMessage } from "@/lib/api/client";
import { Mingle } from "@/types/mingle";

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

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, openModal } = useAuth();

  const mingleId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [mingle, setMingle] = useState<Mingle | null>(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mingleId) return;
    let isMounted = true;
    setLoading(true);

    getMingle(mingleId)
      .then((data) => {
        if (isMounted) setMingle(data);
      })
      .catch((err) => {
        if (isMounted) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mingleId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">Loading checkout…</p>
      </div>
    );
  }

  if (error || !mingle) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-brand-navy">Experience Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "We could not find the selected experience for checkout."}
        </p>
        <Link href="/browse" className="mt-6 inline-block">
          <Button variant="coral" className="rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Browse Mingles
          </Button>
        </Link>
      </div>
    );
  }

  // Defect #3 Fix: Past Event lockout guard
  const isPast = (() => {
    try {
      const now = new Date();
      const eventDate = new Date(`${mingle.event_date}T${mingle.start_time || "00:00:00"}`);
      return eventDate < now;
    } catch {
      return false;
    }
  })();

  const remaining = mingle.spots_remaining ?? Math.max(0, mingle.capacity - (mingle.confirmed_attendees_count || 0));
  const maxPlaces = Math.max(1, Math.min(remaining, 5));
  const unitPrice = parseFloat(mingle.ticket_price || "0");
  const totalPrice = unitPrice * places;

  const handlePlacesChange = (newVal: number) => {
    if (newVal >= 1 && newVal <= maxPlaces) {
      setPlaces(newVal);
    }
  };

  const handlePay = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in or create an account to reserve your place.");
      openModal("login");
      return;
    }

    if (isPast) {
      toast.error("Registration closed. This experience took place in the past.");
      return;
    }

    if (remaining <= 0) {
      toast.error("This mingle is sold out.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      // 1. Create concurrency-safe reservation
      const bookingRes = await createBooking({
        mingle_id: mingle.id,
        places_booked: places,
      });

      const bookingId = bookingRes.booking.id;

      // 2. Initiate Stripe Checkout Session
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const successUrl = `${currentOrigin}/bookings/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentOrigin}/bookings/${bookingId}/cancelled`;

      const checkoutRes = await createCheckoutSession(bookingId, {
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // 3. Handle redirection
      if (checkoutRes.checkout_url) {
        if (checkoutRes.checkout_url.includes("cs_mock_")) {
          // Dev / mock mode fallback: route to success page directly
          toast.success("Reservation confirmed (sandbox mode). Redirecting…");
          router.push(`/bookings/${bookingId}/success?session_id=${checkoutRes.session_id}`);
        } else {
          window.location.href = checkoutRes.checkout_url;
        }
      } else {
        toast.error("Could not obtain secure payment URL. Please try again.");
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg || "Checkout failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:py-12 text-left">
      <Link
        href={`/mingles/${mingle.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-coral transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Experience
      </Link>

      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-navy mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Column: Place Selection & Security Details */}
        <div className="md:col-span-3 space-y-6">
          {/* Defect #3 Fix: Past Date Alert Banner */}
          {isPast ? (
            <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-heading text-lg font-bold">Registration Closed</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    This experience took place in the past on {formatDate(mingle.event_date)}. Ticket sales are closed.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Link href="/browse">
                  <Button variant="coral" className="rounded-full px-6 text-xs uppercase font-bold tracking-wider">
                    Browse Upcoming Mingles
                  </Button>
                </Link>
              </div>
            </div>
          ) : remaining <= 0 ? (
            <div className="rounded-3xl border border-border/80 bg-brand-ivory/50 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-brand-coral mx-auto mb-2" />
              <h3 className="font-heading text-lg font-bold text-brand-navy">This Mingle is Sold Out</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All seats for this session have been reserved.
              </p>
              <Link href="/browse" className="mt-4 inline-block">
                <Button variant="outline" className="rounded-full px-6 text-xs uppercase font-bold tracking-wider">
                  Find other Mingles
                </Button>
              </Link>
            </div>
          ) : (
            /* Places Selector Card */
            <div className="rounded-3xl border border-border/70 bg-white p-6 sm:p-7 shadow-xs">
              <h2 className="font-heading text-xl font-bold text-brand-navy mb-2">
                How many places?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Come alone or bring friends &mdash; you can reserve up to {maxPlaces} {maxPlaces === 1 ? "place" : "places"}.
              </p>

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => handlePlacesChange(places - 1)}
                  disabled={places <= 1}
                  aria-label="Decrease places"
                  className="w-12 h-12 rounded-full border border-border/80 bg-brand-ivory/40 flex items-center justify-center text-brand-navy hover:bg-brand-stone/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <span
                  data-testid="places-count"
                  className="text-3xl font-extrabold text-brand-navy w-12 text-center"
                >
                  {places}
                </span>

                <button
                  type="button"
                  onClick={() => handlePlacesChange(places + 1)}
                  disabled={places >= maxPlaces}
                  aria-label="Increase places"
                  className="w-12 h-12 rounded-full border border-border/80 bg-brand-ivory/40 flex items-center justify-center text-brand-navy hover:bg-brand-stone/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <span className="text-xs font-semibold text-muted-foreground ml-2">
                  ({remaining} {remaining === 1 ? "seat" : "seats"} left)
                </span>
              </div>
            </div>
          )}

          {/* Secure Payment Card */}
          <div className="rounded-3xl border border-border/70 bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 text-brand-navy mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="font-heading text-lg font-bold">
                Secure Payment
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You will complete payment through Stripe&apos;s encrypted checkout. Your payment card information is handled directly by Stripe and is never stored on Mingler servers.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-bit SSL encrypted &amp; SCA compliant
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="font-heading text-xl font-bold text-brand-navy mb-5">
              Order Summary
            </h2>

            {/* Experience Snapshot */}
            <div className="flex gap-3 pb-5 border-b border-border/50">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-brand-stone/20 shrink-0">
                {mingle.hero_image ? (
                  <Image
                    src={mingle.hero_image}
                    alt={mingle.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-navy/10 text-brand-navy font-bold text-xs">
                    M
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-brand-navy truncate">
                  {mingle.title}
                </h3>
                {mingle.venue && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-brand-coral" />
                    {mingle.venue.name}, {mingle.venue.area}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {formatDate(mingle.event_date)} &bull; {mingle.start_time?.slice(0, 5)}
                </p>
                <div className="mt-1.5">
                  <span className="inline-block rounded-md bg-brand-ivory px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                    Ages {mingle.age_min}&ndash;{mingle.age_max}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="py-4 space-y-2.5 text-sm border-b border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  £{unitPrice.toFixed(2)} &times; {places} {places === 1 ? "place" : "places"}
                </span>
                <span className="font-medium text-brand-navy">£{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Booking fee</span>
                <span className="font-medium text-emerald-700">£0.00</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-baseline mb-6">
              <span className="font-heading text-lg font-bold text-brand-navy">Total</span>
              <span className="font-heading text-2xl font-extrabold text-brand-coral">
                £{totalPrice.toFixed(2)}
              </span>
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl mb-4 border border-rose-200">
                {error}
              </p>
            )}

            {/* Pay Button / Auth Prompt */}
            {!isAuthenticated ? (
              <Button
                variant="coral"
                onClick={() => openModal("login")}
                className="w-full h-12 rounded-full text-xs font-bold uppercase tracking-wider shadow-md shadow-brand-coral/20"
              >
                Sign In to Book Places
              </Button>
            ) : isPast ? (
              <Button
                disabled
                className="w-full h-12 rounded-full text-xs font-bold uppercase tracking-wider opacity-60"
              >
                Event Closed
              </Button>
            ) : remaining <= 0 ? (
              <Button
                disabled
                className="w-full h-12 rounded-full text-xs font-bold uppercase tracking-wider opacity-60"
              >
                Fully Booked
              </Button>
            ) : (
              <Button
                variant="coral"
                onClick={handlePay}
                disabled={paying}
                className="w-full h-12 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-brand-coral/20"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing Checkout…
                  </>
                ) : (
                  `Pay £${totalPrice.toFixed(2)}`
                )}
              </Button>
            )}

            <p className="mt-3 text-[11px] text-center text-muted-foreground leading-normal">
              By confirming your reservation you agree to Mingler&apos;s cancellation policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading checkout…
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
