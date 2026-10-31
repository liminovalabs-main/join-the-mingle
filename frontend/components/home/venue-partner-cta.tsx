import * as React from "react";
import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * VenuePartnerCta component —
 * Homepage callout banner inviting London restaurants, wine bars, and event spaces
 * to become partner venues.
 */
export function VenuePartnerCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#1F2E29] to-brand-navy p-8 sm:p-12 text-brand-ivory shadow-xl border border-brand-ivory/10">
        <div
          aria-hidden="true"
          className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-coral/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4 backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Venue Partnerships</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Host Mingler Experiences at Your Venue
            <span className="text-brand-coral">.</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-brand-ivory/80">
            Fill tables during off-peak times with verified, polite, and engaged diners. Zero listing fees, zero upfront risk &mdash; we bring the crowd, you deliver the hospitality.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-brand-ivory/90">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full control over dates & table caps</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated payouts via Stripe Connect</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
            <Link
              href="/venue/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-semibold text-white transition-all hover:bg-brand-coral/90 shadow-lg shadow-brand-coral/25 active:scale-95 cursor-pointer"
            >
              <span>Register Your Venue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/venues"
              className="inline-flex items-center justify-center rounded-full border border-brand-ivory/30 px-6 py-3.5 font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10 cursor-pointer"
            >
              Explore Partner Directory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
