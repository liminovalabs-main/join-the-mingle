"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Heart, Sparkles, Users } from "lucide-react";
import { MingleCard } from "@/components/mingles/mingle-card";
import { useAuth } from "@/hooks/use-auth";
import { getMingles } from "@/lib/api/mingles";
import { Mingle } from "@/types/mingle";

export default function Home() {
  const { user } = useAuth();
  const isVisitor = !user;
  const [mingles, setMingles] = useState<Mingle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMingles({ page_size: 6, upcoming_only: true })
      .then((res) => {
        if (isMounted) setMingles(res.results || []);
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
  }, []);

  return (
    <div className="w-full text-left" suppressHydrationWarning>
      {/* Hero Section — Exact Base44 Headline & Styling */}
      <section className="relative overflow-hidden bg-brand-navy text-brand-ivory">
        {/* Atmospheric Backdrop Gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-coral/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-blue/15 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-brand-navy/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-14 md:pb-28 md:pt-20">
          <h1 className="font-heading text-4xl font-extrabold uppercase leading-[0.88] tracking-[-0.03em] text-balance sm:text-6xl md:text-7xl lg:text-8xl">
            The Physical<br />Social Network<span className="text-brand-coral">.</span>
          </h1>

          <p className="mt-8 max-w-2xl font-heading text-2xl font-semibold leading-tight md:text-4xl">
            Great things to do.<br />
            <span className="text-brand-ivory/55">New people to do them with.</span>
          </p>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-brand-ivory/70 md:text-lg">
            Discover great experiences across London, see who&apos;s going, and meet people naturally &mdash; come on your own or bring friends.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/browse"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-coral px-8 py-4 font-semibold text-white transition-all hover:bg-brand-coral/90 shadow-lg shadow-brand-coral/25 active:scale-95"
            >
              Find your mingle
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/venues"
              className="inline-flex items-center justify-center rounded-full border border-brand-ivory/25 px-8 py-4 font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10"
            >
              Explore Venues
            </Link>
          </div>
        </div>
      </section>

      {/* Find Your Next Mingle Section */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-brand-navy md:text-5xl">
              Find your next Mingle
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Real experiences, real people, right now in London.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy transition-colors hover:text-brand-coral sm:inline-flex"
          >
            View all Mingles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-brand-stone/20" />
                <div className="h-5 w-3/4 animate-pulse rounded-full bg-brand-stone/20" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-brand-stone/20" />
              </div>
            ))}
          </div>
        ) : mingles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-brand-ivory/30 p-12 text-center">
            <p className="font-bold text-brand-navy text-lg">New experiences coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back regularly or explore London partner venues.
            </p>
            <Link href="/venues" className="mt-4 inline-block">
              <button
                type="button"
                className="rounded-full bg-brand-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Browse Venues
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {mingles.map((m) => (
              <MingleCard key={m.id} mingle={m} isVisitor={isVisitor} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center sm:hidden">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy"
          >
            View all Mingles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How Mingler Works — 3-Step Guide */}
      <section className="bg-brand-ivory/40 border-y border-border/50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-coral">
              How It Works
            </span>
            <h2 className="mt-2 font-heading text-3xl font-extrabold text-brand-navy md:text-4xl">
              Meet people doing what you love
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Say goodbye to awkward small talk and endless swiping. Connect organically around shared experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl bg-white p-8 border border-border/60 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-bold text-lg mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-brand-navy mb-2">
                1. Choose an Experience
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Browse hand-picked dinners, cocktail mixers, wine flights, and masterclasses at top London venues.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 border border-border/60 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-lg mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-brand-navy mb-2">
                2. See Who&apos;s Going
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Check attendee rosters and reserve your place. Come solo or bring a friend &mdash; everyone is here to mingle.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 border border-border/60 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-brand-navy mb-2">
                3. Connect Double-Blind
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Select who you enjoyed meeting after the mingle. When the feeling is mutual, your social handles are unlocked!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
