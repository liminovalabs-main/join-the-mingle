"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Tag } from "lucide-react";
import { Venue } from "@/types/venue";

interface VenueCardProps {
  venue: Venue;
}

const FALLBACK_VENUE_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

export function VenueCard({ venue }: VenueCardProps) {
  const imageUrl = venue.hero_image || FALLBACK_VENUE_IMAGE;
  const ratingDisplay = venue.average_rating ? venue.average_rating.toFixed(1) : "5.0";
  const slug = venue.slug || venue.id;

  return (
    <Link
      href={`/venues/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:border-brand-coral/40 hover:shadow-lg text-left"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-stone/20">
        <Image
          src={imageUrl}
          alt={venue.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-brand-navy/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-ivory backdrop-blur">
          {venue.category || "London Venue"}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-heading text-lg font-bold text-brand-navy group-hover:text-brand-coral transition-colors line-clamp-1">
          {venue.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {venue.area && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-blue shrink-0" /> {venue.area}
            </span>
          )}
          <span className="text-brand-stone">•</span>
          <span className="flex items-center gap-1 font-medium text-brand-navy">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            {ratingDisplay} ({venue.review_count || 0})
          </span>
        </div>

        {venue.address && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {venue.address}, {venue.postcode}
          </p>
        )}
      </div>
    </Link>
  );
}
export default VenueCard;
