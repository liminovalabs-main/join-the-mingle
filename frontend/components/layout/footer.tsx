"use client";

import Link from "next/link";
import { MinglerLogo } from "@/components/brand/mingler-logo";

export function Footer() {
  return (
    <footer className="bg-brand-navy text-brand-ivory border-t border-brand-ivory/10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
        <div>
          <MinglerLogo size="text-xl" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-ivory/50">
            The Physical Social Network
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-xs text-brand-ivory/60">
          <Link href="/browse" className="hover:text-brand-ivory transition-colors">
            Browse Mingles
          </Link>
          <Link href="/how-it-works" className="hover:text-brand-ivory transition-colors">
            How It Works
          </Link>
          <Link href="/venue" className="hover:text-brand-ivory transition-colors">
            Venue Partners
          </Link>
          <p className="text-xs text-brand-ivory/50 sm:border-l sm:border-brand-ivory/20 sm:pl-8">
            Great things to do. New people to do them with. — London
          </p>
        </div>
      </div>
    </footer>
  );
}
