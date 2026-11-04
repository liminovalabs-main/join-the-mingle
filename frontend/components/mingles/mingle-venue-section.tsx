"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getVenue } from "@/lib/api/venues";
import { MingleVenueSummary } from "@/types/mingle";
import { Venue } from "@/types/venue";

interface MingleVenueSectionProps {
  venueSummary?: MingleVenueSummary;
  venueId?: string;
}

export function MingleVenueSection({
  venueSummary,
  venueId,
}: MingleVenueSectionProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const identifier = venueSummary?.slug || venueSummary?.id || venueId;

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    getVenue(identifier)
      .then((data) => {
        if (isMounted) setVenue(data);
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
  }, [identifier]);

  const activeVenueName = venue?.name || venueSummary?.name;
  const activeArea = venue?.area || venueSummary?.area;
  const activeAddress = venue?.address || venueSummary?.address;
  const activeSlug = venue?.slug || venueSummary?.slug || venueId;

  if (!activeVenueName && !loading) return null;

  const validHours = (venue?.opening_hours || []).filter((h) => !h.is_closed && h.open_time);

  return (
    <div className="mb-10 rounded-3xl border border-border/60 bg-white p-6 md:p-8 shadow-xs text-left">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="mb-2 inline-block rounded-full bg-brand-coral/10 px-3.5 py-1 text-xs sm:text-[13px] font-semibold text-brand-coral">
            The Venue
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-navy">
            {activeVenueName}
          </h2>
          {activeArea && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm sm:text-base text-muted-foreground">
              <MapPin className="h-4 w-4 text-brand-blue shrink-0" />
              <span>
                {activeAddress ? `${activeAddress}, ` : ""}
                {activeArea}
              </span>
            </p>
          )}
        </div>

        {activeSlug && (
          <Link
            href={`/venues/${activeSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-4 sm:px-4.5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-brand-navy hover:border-brand-coral hover:text-brand-coral transition-colors"
          >
            View venue profile <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {venue?.description && (
        <p className="mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed text-muted-foreground">
          {venue.description}
        </p>
      )}
    </div>
  );
}
export default MingleVenueSection;
