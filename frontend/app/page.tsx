"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MingleCard } from "@/components/mingles/mingle-card";
import { useAuth } from "@/hooks/use-auth";
import { getMingles } from "@/lib/api/mingles";
import { Mingle } from "@/types/mingle";
import Image from "next/image";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { CategoryPills } from "@/components/home/category-pills";
import { DictionaryEntry } from "@/components/brand/dictionary-entry";
import { VenuePartnerCta } from "@/components/home/venue-partner-cta";

export default function Home() {
  const { user } = useAuth();
  const isVisitor = !user;
  const [mingles, setMingles] = useState<Mingle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    getMingles({ page_size: 12, upcoming_only: true })
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

  const filteredMingles = useMemo(() => {
    if (selectedCategory === "all") return mingles.slice(0, 6);
    return mingles
      .filter((m) => m.experience_type === selectedCategory)
      .slice(0, 6);
  }, [mingles, selectedCategory]);

  return (
    <div className="w-full text-left" suppressHydrationWarning>
      {/* Hero Section — Exact Base44 Headline, Atmospheric Photography & Styling */}
      <section className="relative overflow-hidden bg-brand-navy text-brand-ivory">
        <HeroBackdrop />

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
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-coral px-8 py-4 font-semibold text-white transition-all hover:bg-brand-coral/90 shadow-lg shadow-brand-coral/25 active:scale-95 cursor-pointer"
            >
              <span>Find your mingle</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-brand-ivory/25 px-8 py-4 font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10 cursor-pointer"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Find Your Next Mingle Section */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-brand-navy md:text-5xl">
              Find your next mingle<span className="text-brand-coral">.</span>
            </h2>
            <p className="mt-2 text-muted-foreground md:text-lg">
              Real experiences, real people, right now in London.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy transition-colors hover:text-brand-coral sm:inline-flex cursor-pointer"
          >
            <span>View all Mingles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Pills Bar */}
        <div className="mb-8">
          <CategoryPills
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
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
        ) : filteredMingles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-brand-ivory/30 p-12 text-center">
            <p className="font-bold text-brand-navy text-lg">No mingles found in this category</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try exploring other categories or view all upcoming London experiences.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="mt-4 inline-block rounded-full bg-brand-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-coral/90 cursor-pointer"
            >
              Show All Experiences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMingles.map((m) => (
              <MingleCard key={m.id} mingle={m} isVisitor={isVisitor} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center sm:hidden">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy cursor-pointer"
          >
            <span>View all Mingles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Base44 Signature Editorial Moment: Dictionary Entry */}
      <section className="border-y border-border/50 bg-[#FBF8F3] py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <DictionaryEntry />
        </div>
      </section>

      {/* How Mingler Works — 4-Step Interactive Showcase matching Base44 */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-coral">
                How It Works
              </span>
              <h2 className="mt-2 font-heading text-3xl font-extrabold text-brand-navy md:text-4xl">
                Four steps to your next great mingle<span className="text-brand-coral">.</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base max-w-xl">
                From finding an experience you love to connecting double-blind afterward &mdash; no awkwardness, just real rooms.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy hover:text-brand-coral transition-colors cursor-pointer"
            >
              <span>Learn More</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="group rounded-3xl bg-white p-6 border border-border/70 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="aspect-square w-full rounded-2xl bg-brand-stone/10 mb-5 border border-border/40 relative overflow-hidden">
                  <Image
                    src="/images/steps/step-1-join.jpg"
                    alt="Step 1: Join in seconds - verified profile"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-coral">
                  01. Join
                </span>
                <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-2">
                  Join in seconds
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Quick verified sign-up. Private and secure &mdash; zero public PII exposure.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group rounded-3xl bg-white p-6 border border-border/70 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="aspect-square w-full rounded-2xl bg-brand-stone/10 mb-5 border border-border/40 relative overflow-hidden">
                  <Image
                    src="/images/steps/step-2-find.jpg"
                    alt="Step 2: Find your mingle - handpicked experiences"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2E29]">
                  02. Find
                </span>
                <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-2">
                  Find your mingle
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Dine, play, create, learn. Handpicked experiences at top London venues.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group rounded-3xl bg-white p-6 border border-border/70 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="aspect-square w-full rounded-2xl bg-brand-stone/10 mb-5 border border-border/40 relative overflow-hidden">
                  <Image
                    src="/images/steps/step-3-mingle.jpg"
                    alt="Step 3: Show up & mingle - intimate social tables"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                  03. Mingle
                </span>
                <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-2">
                  Show up & mingle
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Intimate tables of 6–10. Come solo or bring friends &mdash; everyone is here to connect.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="group rounded-3xl bg-white p-6 border border-border/70 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="aspect-square w-full rounded-2xl bg-brand-stone/10 mb-5 border border-border/40 relative overflow-hidden">
                  <Image
                    src="/images/steps/step-4-connect.jpg"
                    alt="Step 4: Mingle again - double-blind mutual connections"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  04. Connect
                </span>
                <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-2">
                  Mingle again
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Privately select attendees post-event. Socials unlock only when feeling is mutual.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Venue Partner CTA Banner */}
      <VenuePartnerCta />
    </div>
  );
}
