import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutLifestyleImage } from "@/components/about/about-lifestyle-image";
import { WhyItMatters } from "@/components/about/why-it-matters";
import { ConnectionMetrics } from "@/components/about/connection-metrics";
import { WhoWeAre } from "@/components/about/who-we-are";
import { FounderPhoto } from "@/components/about/founder-photo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Mingler — The Physical Social Network",
  description:
    "Discover the story behind Mingler. Built by people who like people, helping Londoners meet naturally over shared food, drinks, and creative experiences in real life.",
};

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-[#FBF8F3]">
      {/* Ambient background blur circles matching Base44 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-[#C9D0C3]/40 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-[#FADBD8]/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#C9D0C3]/30 blur-3xl" />
      </div>

      <AboutLifestyleImage />

      <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-16 md:pt-10 md:pb-24">
        <div className="space-y-14 md:space-y-20">
          <WhyItMatters />
          <ConnectionMetrics />
          <WhoWeAre />
          <FounderPhoto />
        </div>

        <div className="mt-14">
          <Link
            href="/browse"
            className="group inline-flex items-center gap-2 rounded-full bg-brand-coral px-7 py-3.5 font-semibold text-white transition-all hover:bg-brand-coral/90 shadow-lg shadow-brand-coral/25 active:scale-95 cursor-pointer"
          >
            <span>Find your mingle</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
