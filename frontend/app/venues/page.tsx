"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Store } from "lucide-react";
import { VenueCard } from "@/components/venues/venue-card";
import { Button } from "@/components/ui/button";
import { getVenues } from "@/lib/api/venues";
import { Venue } from "@/types/venue";

const VENUE_AREAS = [
  "All London",
  "Shoreditch",
  "Soho",
  "Brixton",
  "Mayfair",
  "Covent Garden",
  "Marylebone",
];

export default function VenuesDirectoryPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("All London");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getVenues({ page_size: 60 })
      .then((res) => {
        if (isMounted) setVenues(res.results || []);
      })
      .catch(() => {
        if (isMounted) setVenues([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (selectedArea !== "All London" && v.area?.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const haystack = `${v.name} ${v.area || ""} ${v.category || ""} ${v.address || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [venues, search, selectedArea]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-coral mb-2">
            <Store className="w-4 h-4" /> London Directory
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-brand-navy md:text-5xl">
            Venues
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-xl">
            The rooms, cocktail bars, wine cellars, and chef&apos;s tables where Mingler experiences happen.
          </p>
        </div>

        <Link href="/venue/register">
          <Button variant="outline" className="rounded-full border-border text-xs font-bold uppercase tracking-wider text-brand-navy hover:text-brand-coral">
            Register a Venue
          </Button>
        </Link>
      </div>

      {/* Search and Area Filters */}
      <div className="mb-8 space-y-4 rounded-3xl border border-border/60 bg-white p-5 shadow-xs">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues by name, area, or category..."
            className="w-full rounded-full border border-border/70 bg-brand-ivory/30 py-3 pl-11 pr-4 text-sm font-medium text-brand-navy focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-coral/20 transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {VENUE_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                selectedArea === area
                  ? "bg-brand-navy text-white shadow-xs"
                  : "bg-brand-stone/40 text-brand-navy hover:bg-brand-stone/70"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="mb-6 text-sm font-semibold text-muted-foreground">
        {filteredVenues.length} {filteredVenues.length === 1 ? "venue" : "venues"} in London
      </p>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-brand-stone/20" />
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-brand-ivory/30 p-16 text-center">
          <Store className="mx-auto h-10 w-10 text-brand-coral mb-3" />
          <p className="text-lg font-bold text-brand-navy">No venues found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.trim()
              ? "No venue matches your search criteria."
              : "Venue listings appear here once approved by our curation team."}
          </p>
          <Link href="/venue/register" className="mt-5 inline-block">
            <Button variant="coral" className="rounded-full px-6">
              Register a Venue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVenues.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}
    </div>
  );
}
