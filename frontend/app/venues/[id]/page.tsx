"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Star,
} from "lucide-react";
import { MingleCard } from "@/components/mingles/mingle-card";
import { VenueReviewForm } from "@/components/venues/venue-review-form";
import { VenueReviewList } from "@/components/venues/venue-review-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getMingles } from "@/lib/api/mingles";
import { getVenue, getVenueReviews } from "@/lib/api/venues";
import { Mingle } from "@/types/mingle";
import { Venue, VenueReview } from "@/types/venue";

const FALLBACK_VENUE_HERO =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80";

function VenueDetailContent() {
  const params = useParams();
  const { user } = useAuth();

  const venueSlugOrId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [mingles, setMingles] = useState<Mingle[]>([]);
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!venueSlugOrId) return;

    let isMounted = true;
    setLoading(true);

    getVenue(venueSlugOrId)
      .then(async (venueData) => {
        if (!isMounted) return;
        setVenue(venueData);

        // Fetch upcoming mingles hosted at this venue
        const minglesPromise = getMingles({
          search: venueData.name,
          upcoming_only: true,
        }).catch(() => ({ results: [] }));

        // Fetch verified venue reviews
        const reviewsPromise = getVenueReviews(venueSlugOrId)
          .then((res) => res.results)
          .catch(() => venueData.reviews || []);

        const [minglesRes, reviewsRes] = await Promise.all([
          minglesPromise,
          reviewsPromise,
        ]);

        if (isMounted) {
          setMingles(minglesRes.results || []);
          setReviews(reviewsRes || []);
        }
      })
      .catch(() => {
        if (isMounted) setVenue(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [venueSlugOrId, reloadKey]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24 text-center">
        <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">Loading venue profile...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-brand-navy">Venue Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This venue profile could not be located or may be pending curation.
        </p>
        <Link href="/venues" className="mt-6 inline-block">
          <Button variant="coral" className="rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Venues
          </Button>
        </Link>
      </div>
    );
  }

  const heroImage = venue.hero_image || FALLBACK_VENUE_HERO;
  const ratingDisplay = venue.average_rating ? venue.average_rating.toFixed(1) : "5.0";
  const hours = (venue.opening_hours || []).filter((h) => !h.is_closed && h.open_time);

  return (
    <div className="text-left">
      {/* Hero Header Banner */}
      <div className="relative h-72 w-full overflow-hidden bg-brand-navy md:h-96">
        <Image
          src={heroImage}
          alt={venue.name}
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-8">
          <span className="rounded-full bg-brand-ivory/20 px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-brand-ivory backdrop-blur">
            {venue.category || "London Venue"}
          </span>

          <h1 className="mt-3 font-heading text-4xl font-extrabold text-brand-ivory md:text-5xl">
            {venue.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-brand-ivory/90 font-medium">
            {venue.area && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-coral" /> {venue.address ? `${venue.address}, ` : ""}{venue.area}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {ratingDisplay} ★ ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-coral transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> All Venues
          </Link>
        </div>

        {/* Venue Information Card */}
        <div className="mb-10 rounded-3xl border border-border/60 bg-white p-6 md:p-8 shadow-xs">
          <h2 className="font-heading text-2xl font-bold text-brand-navy mb-3">
            About the Space
          </h2>
          <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-muted-foreground">
            {venue.description || "A curated venue partner hosting social experiences in London."}
          </p>

          {venue.address && (
            <div className="mt-6 pt-5 border-t border-border/50 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-coral shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Location &amp; Postcode
                </p>
                <p className="text-sm sm:text-base font-semibold text-brand-navy mt-0.5">
                  {venue.address}, {venue.area}, {venue.postcode}
                </p>
              </div>
            </div>
          )}

          {/* Validated 7-Day Operating Hours (Defect #8 Fix) */}
          {hours.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <h3 className="flex items-center gap-2 font-heading text-sm sm:text-base font-bold text-brand-navy mb-3">
                <Clock className="h-4 w-4 text-brand-coral" /> Operating Hours
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {hours.map((row) => (
                  <li
                    key={row.id || row.day_of_week}
                    className="text-xs sm:text-sm text-muted-foreground flex items-center justify-between p-2.5 rounded-xl bg-brand-ivory/50"
                  >
                    <span className="font-semibold text-brand-navy">{row.day_name}</span>
                    <span>
                      {row.open_time?.slice(0, 5)} &ndash; {row.close_time?.slice(0, 5)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Mingles Hosted Here */}
        <div className="mb-12">
          <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-brand-navy mb-6">
            <CalendarDays className="h-6 w-6 text-brand-coral" /> Mingles at this Venue
          </h2>
          {mingles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-brand-ivory/30 p-8 text-center text-sm text-muted-foreground">
              No upcoming mingles scheduled at this venue right now. Check back soon!
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mingles.map((m) => (
                <MingleCard key={m.id} mingle={m} />
              ))}
            </div>
          )}
        </div>

        {/* Verified Reviews Section (Base44 Defect #7 Fix) */}
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-navy">
              Verified Reviews ({reviews.length})
            </h2>
            <div className="flex items-center gap-1 text-sm font-bold text-brand-coral">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{ratingDisplay} ★</span>
            </div>
          </div>

          {/* Review Submission Form if logged in */}
          {user && (
            <div className="mb-8">
              <VenueReviewForm
                venueSlugOrId={venue.slug || venue.id}
                onSaved={() => setReloadKey((k) => k + 1)}
              />
            </div>
          )}

          {/* Reviews List */}
          <VenueReviewList
            reviews={reviews}
            emptyText="No verified reviews for this venue yet. Attend a mingle here to leave the first review!"
          />
        </div>
      </div>
    </div>
  );
}

export default function VenueDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-5 py-24 text-center">
          <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading venue profile...
          </p>
        </div>
      }
    >
      <VenueDetailContent />
    </Suspense>
  );
}

