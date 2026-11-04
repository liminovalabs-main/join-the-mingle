"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass } from "lucide-react";
import { MingleCard } from "@/components/mingles/mingle-card";
import { FilterState, MingleFilterBar } from "@/components/mingles/mingle-filter-bar";
import { useAuth } from "@/hooks/use-auth";
import { getMingles } from "@/lib/api/mingles";
import { Mingle } from "@/types/mingle";

export default function BrowsePage() {
  const { user, openModal } = useAuth();
  const isVisitor = !user;

  const [mingles, setMingles] = useState<Mingle[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    date: "upcoming",
    area: "all",
    age: "all",
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const includePast = filters.date === "all";

    getMingles({
      include_past: includePast,
      upcoming_only: !includePast,
      page_size: 100,
    })
      .then((res) => {
        if (isMounted) {
          setMingles(res.results || []);
        }
      })
      .catch(() => {
        if (isMounted) setMingles([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters.date]);

  // Client-side multi-parameter filter matching Base44 algorithms
  const filteredMingles = useMemo(() => {
    return mingles.filter((m) => {
      // 1. Experience Type
      if (filters.type !== "all" && m.experience_type !== filters.type) {
        return false;
      }

      // 2. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const haystack = `${m.title} ${m.venue?.name || ""} ${m.venue?.area || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      // 3. Area / Borough
      if (filters.area !== "all" && m.venue?.area) {
        if (m.venue.area.toLowerCase() !== filters.area.toLowerCase()) {
          return false;
        }
      }

      // 4. Date Filter
      if (filters.date === "week" || filters.date === "month") {
        const eventDate = new Date(m.event_date);
        const now = new Date();
        const targetDate = new Date(now);
        if (filters.date === "week") {
          targetDate.setDate(now.getDate() + 7);
        } else {
          targetDate.setDate(now.getDate() + 30);
        }
        if (eventDate > targetDate || eventDate < new Date(now.setHours(0, 0, 0, 0))) {
          return false;
        }
      }

      // 5. Age Range
      if (filters.age !== "all") {
        const [minAgeStr, maxAgeStr] = filters.age.split("-");
        const filterMin = parseInt(minAgeStr, 10);
        const filterMax = parseInt(maxAgeStr, 10);

        if (m.age_min && m.age_min > filterMax) return false;
        if (m.age_max && m.age_max < filterMin) return false;
      }

      return true;
    });
  }, [mingles, filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 text-left">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-coral mb-2">
          <Compass className="w-4 h-4" /> London Experiences
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-navy">
          browse mingles<span className="text-brand-coral">.</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Real experiences, real people, right now across London boroughs.
        </p>
      </div>

      {/* Visitor Prompt Banner */}
      {isVisitor && (
        <div className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border border-brand-coral/20 bg-brand-coral/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-brand-navy">
              new to mingler?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Sign up to see attendee rosters, save your spot at dinners and cocktail tastings, and connect afterwards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal("register")}
            className="rounded-full bg-brand-coral px-6 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:bg-brand-coral/90 transition-all shrink-0 cursor-pointer"
          >
            Create an Account
          </button>
        </div>
      )}

      {/* Multi-Facet Filter Bar */}
      <MingleFilterBar filters={filters} onChange={setFilters} />

      {/* Results Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
          {filteredMingles.length} {filteredMingles.length === 1 ? "experience" : "experiences"} found
        </p>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[4/3] animate-pulse rounded-2xl bg-brand-stone/20" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-brand-stone/20" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-brand-stone/20" />
            </div>
          ))}
        </div>
      ) : filteredMingles.length === 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-dashed border-border bg-brand-ivory/30 p-10 sm:p-16 text-center">
          <p className="text-base sm:text-lg font-bold text-brand-navy">No mingles match your filters</p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Try adjusting your search terms or widening your date and category filters.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({
                search: "",
                type: "all",
                date: "upcoming",
                area: "all",
                age: "all",
              })
            }
            className="mt-5 rounded-full border border-border bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-brand-navy hover:border-brand-coral hover:text-brand-coral transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMingles.map((m) => (
            <MingleCard key={m.id} mingle={m} isVisitor={isVisitor} />
          ))}
        </div>
      )}
    </div>
  );
}
