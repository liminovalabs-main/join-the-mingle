import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import { FaqAccordion } from "@/components/howitworks/faq-accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | mingler — The Physical Social Network",
  description:
    "Four simple steps to your next great mingle in London. Discover curated experiences, meet great people around intimate tables, and connect double-blind.",
};

const FOUR_STEPS = [
  {
    step: "01",
    tag: "Join",
    title: "Join in seconds",
    image: "/images/steps/step-1-join.jpg",
    alt: "Step 1: Join in seconds - verified profile",
  },
  {
    step: "02",
    tag: "Find",
    title: "Find your mingle",
    image: "/images/steps/step-2-find.jpg",
    alt: "Step 2: Find your mingle - handpicked activities",
  },
  {
    step: "03",
    tag: "Mingle",
    title: "Show up & mingle",
    image: "/images/steps/step-3-mingle.jpg",
    alt: "Step 3: Show up and mingle - intimate table experiences",
  },
  {
    step: "04",
    tag: "Connect",
    title: "Mingle again",
    image: "/images/steps/step-4-connect.jpg",
    alt: "Step 4: Mingle again - connect double-blind",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative overflow-hidden bg-[#FBF8F3]">
      {/* Ambient background blur spheres matching Base44 design tokens */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-80 w-80 rounded-full bg-[#C9D0C3]/40 blur-3xl" />
        <div className="absolute -right-24 top-96 h-96 w-96 rounded-full bg-[#FADBD8]/40 blur-3xl" />
        <div className="absolute bottom-40 left-1/4 h-80 w-80 rounded-full bg-[#C9D0C3]/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-20 md:pt-16 md:pb-28">
        {/* Editorial Eyebrow & Hero Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
            How mingler Works
          </p>
          <h1 className="mt-4 font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#1A2624] leading-[1.05]">
            Real people. Great rooms.
            <br />
            <span className="text-brand-coral">Zero awkwardness.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#1A2624]/75 max-w-2xl">
            mingler replaces endless texting and swipe-fatigue with real conversations over great food, drinks, and activities across London. Here is how it happens in 4 simple steps.
          </p>
        </div>

        {/* 4-Step Visual Preview Banner */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-[#EBEAE5] bg-[#FCFBF6] p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FOUR_STEPS.map((s) => (
              <div key={s.step} className="group flex flex-col items-center text-center">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-stone/10 border border-border/40 shadow-xs mb-3">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Step {s.step} &bull; {s.tag}
                </span>
                <p className="font-heading text-xs sm:text-sm font-bold text-brand-navy mt-0.5">
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Step Interactive Card Grid */}
        <div className="mt-16 sm:mt-24 space-y-16 sm:space-y-24">
          {/* Step 1: Join in seconds */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-coral/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral">
                Step 1
              </span>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-[#1A2624]">
                Join in seconds
                <span className="text-brand-coral">.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1A2624]/70">
                Create your verified profile in moments. We protect your privacy &mdash; your email and private birthdate are never shared publicly.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Age-verified guests for balanced, adult table dynamics</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Only your first name and bio are visible to fellow attendees</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:p-5 border border-border/70 shadow-sm overflow-hidden">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-stone/10">
                  <Image
                    src="/images/steps/step-1-join.jpg"
                    alt="Step 1: Join in seconds - verified profile"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 450px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Find your mingle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:p-5 border border-border/70 shadow-sm overflow-hidden">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-stone/10">
                  <Image
                    src="/images/steps/step-2-find.jpg"
                    alt="Step 2: Find your mingle - handpicked activities"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 450px"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1F2E29]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1F2E29]">
                Step 2
              </span>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-[#1A2624]">
                Find your mingle
                <span className="text-brand-coral">.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1A2624]/70">
                Choose an experience you genuinely want to do: candlelit supper clubs in Soho, natural wine tastings in Shoreditch, cocktail masterclasses, or weekend gallery walks.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Preview attendee numbers and demographics in real-time</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Book 1 to 5 seats &mdash; come solo (70% do!) or bring friends</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3: Show up and mingle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
                Step 3
              </span>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-[#1A2624]">
                Show up and mingle
                <span className="text-brand-coral">.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1A2624]/70">
                No awkward mingling in massive hotel ballrooms. Each table is curated for 6 to 10 people at London&apos;s most welcoming spots, hosted with great hospitality.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Pre-reserved table under &ldquo;Mingler&rdquo; &mdash; walk in effortlessly</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Natural conversation sparked by great food and drinks</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:p-5 border border-border/70 shadow-sm overflow-hidden">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-stone/10">
                  <Image
                    src="/images/steps/step-3-mingle.jpg"
                    alt="Step 3: Show up & mingle - curated group tables"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 450px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Mingle again */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:p-5 border border-border/70 shadow-sm overflow-hidden">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-stone/10">
                  <Image
                    src="/images/steps/step-4-connect.jpg"
                    alt="Step 4: Mingle again - connect double-blind post-mingle"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 450px"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                Step 4
              </span>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-[#1A2624]">
                Mingle again
                <span className="text-brand-coral">.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#1A2624]/70">
                No awkward requests for phone numbers at the table. Post-mingle, open your phone and select the attendees you enjoyed meeting.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span><strong>Double-blind privacy:</strong> Picks remain 100% confidential</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#1A2624]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>When mutual, social links (Instagram, LinkedIn) unlock with celebration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trust, Safety & Quality Section */}
        <div className="mt-24 rounded-3xl bg-[#E0E2D9] p-8 sm:p-12">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-[#5C6B5A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5C6B5A]">
              The Mingler Guarantee
            </span>
          </div>
          <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#1A2624]">
            Thoughtfully engineered for safety, comfort, and authenticity.
          </h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xs p-6 border border-[#5C6B5A]/20">
              <Sparkles className="h-6 w-6 text-brand-coral mb-3" />
              <h4 className="font-bold text-[#1A2624] text-base mb-1">Curated London Venues</h4>
              <p className="text-sm leading-relaxed text-[#1A2624]/75">
                Every venue is personally vetted by our founder team for atmosphere, food excellence, and welcoming service.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xs p-6 border border-[#5C6B5A]/20">
              <ShieldCheck className="h-6 w-6 text-emerald-700 mb-3" />
              <h4 className="font-bold text-[#1A2624] text-base mb-1">Privacy &amp; Data Protection</h4>
              <p className="text-sm leading-relaxed text-[#1A2624]/75">
                Zero public PII exposure. Date of birth and contact information are strictly encrypted and guarded.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xs p-6 border border-[#5C6B5A]/20">
              <Shield className="h-6 w-6 text-brand-blue mb-3" />
              <h4 className="font-bold text-[#1A2624] text-base mb-1">100% Refund Safeguard</h4>
              <p className="text-sm leading-relaxed text-[#1A2624]/75">
                Self-service cancellations up to 48 hours prior to start, and immediate full refunds if any event is rescheduled.
              </p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
              Got Questions?
            </p>
            <h3 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold text-[#1A2624]">
              Frequently Asked Questions
            </h3>
          </div>
          <FaqAccordion />
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-20 sm:mt-28 text-center">
          <div className="inline-block rounded-3xl bg-brand-navy p-8 sm:p-12 text-brand-ivory max-w-3xl w-full shadow-xl">
            <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-brand-ivory">
              Ready to meet new people in London?
            </h3>
            <p className="mt-4 text-base text-brand-ivory/70 max-w-xl mx-auto">
              Browse upcoming dinners, drinks, and creative sessions. Pick an experience and take your seat at the table.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/browse"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-coral px-8 py-4 font-semibold text-white transition-all hover:bg-brand-coral/90 shadow-lg shadow-brand-coral/25 active:scale-95 cursor-pointer"
              >
                <span>Find your mingle</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-brand-ivory/25 px-8 py-4 font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10 cursor-pointer"
              >
                Read our story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
