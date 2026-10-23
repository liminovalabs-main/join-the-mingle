import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  return (
    <div className="w-full" suppressHydrationWarning>
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
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-brand-ivory/25 px-8 py-4 font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Find Your Next Mingle Section — Exact Base44 Grid */}
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

        {/* Curated Preview Experiences */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="group rounded-2xl bg-white border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative aspect-[4/3] bg-brand-stone/30 overflow-hidden flex items-center justify-center">
              <span className="text-4xl select-none">🍷</span>
              <div className="absolute top-3 left-3">
                <Badge variant="coral">Wine Tasting</Badge>
              </div>
              <div className="absolute bottom-3 right-3 bg-brand-navy/90 text-brand-ivory text-xs px-2.5 py-1 rounded-full font-bold">
                £45 / ticket
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-coral" />
                  <span>Covent Garden, WC2</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-navy group-hover:text-brand-coral transition-colors">
                  Natural Wine &amp; Artisan Tapas Mixer
                </h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  Guided sommelier tasting pairing 4 low-intervention natural wines with Mediterranean small plates.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>TK</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-muted-foreground">4 spots left</span>
                </div>
                <span className="text-xs font-semibold text-brand-coral flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl bg-white border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative aspect-[4/3] bg-brand-stone/30 overflow-hidden flex items-center justify-center">
              <span className="text-4xl select-none">🍽️</span>
              <div className="absolute top-3 left-3">
                <Badge variant="default">Dinner Party</Badge>
              </div>
              <div className="absolute bottom-3 right-3 bg-brand-navy/90 text-brand-ivory text-xs px-2.5 py-1 rounded-full font-bold">
                £65 / ticket
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-coral" />
                  <span>Shoreditch, E1</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-navy group-hover:text-brand-coral transition-colors">
                  Chef&apos;s Table Autumn Feast
                </h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  An intimate 8-seat seasonal dinner created by rising star chefs in an open loft kitchen.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>SR</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-muted-foreground">2 spots left</span>
                </div>
                <span className="text-xs font-semibold text-brand-coral flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl bg-white border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative aspect-[4/3] bg-brand-stone/30 overflow-hidden flex items-center justify-center">
              <span className="text-4xl select-none">🍸</span>
              <div className="absolute top-3 left-3">
                <Badge variant="coral">Cocktail Evening</Badge>
              </div>
              <div className="absolute bottom-3 right-3 bg-brand-navy/90 text-brand-ivory text-xs px-2.5 py-1 rounded-full font-bold">
                £38 / ticket
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-coral" />
                  <span>Soho, W1</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-navy group-hover:text-brand-coral transition-colors">
                  Speakeasy Social &amp; Craft Mixology
                </h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  Secret basement bar table with bespoke cocktails and vinyl jazz records.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>EM</AvatarFallback>
                    </Avatar>
                    <Avatar className="w-6 h-6 border border-white">
                      <AvatarFallback>CL</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-muted-foreground">5 spots left</span>
                </div>
                <span className="text-xs font-semibold text-brand-coral flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center sm:hidden">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-brand-navy"
          >
            View all Mingles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
