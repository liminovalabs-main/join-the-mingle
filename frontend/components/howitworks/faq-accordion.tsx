"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Can I come on my own?",
    answer:
      "Yes, absolutely! Over 70% of minglers attend solo. Our partner venues set aside dedicated tables for groups of 6–10, and the entire format is designed so you feel comfortable and welcomed the moment you arrive. No awkward forced games or name badges.",
  },
  {
    question: "How does double-blind matching work?",
    answer:
      "After the experience ends, open your dashboard to review your fellow attendees. Privately tap the people you'd enjoy seeing again. Only when two attendees mutually select each other are social links (Instagram handle, LinkedIn) revealed. If you pick someone and they don't pick back, they will never know.",
  },
  {
    question: "How are mingles curated?",
    answer:
      "We partner directly with London's finest independent restaurants, cocktail lounges, wine bars, and creative studios across Shoreditch, Soho, Mayfair, Covent Garden, and Brixton. Every event is vetted for food quality, atmosphere, and hospitality.",
  },
  {
    question: "What is your cancellation and refund policy?",
    answer:
      "You can cancel your booking directly from 'My Mingler' up to 48 hours before the event start time for a full refund. If an event is ever cancelled or rescheduled by the venue, you receive an immediate 100% refund through Stripe.",
  },
  {
    question: "What are the age guidelines?",
    answer:
      "Each Mingle has an age guideline (for example, 25–35, 30–45, or All Ages 18+) clearly displayed on the card and detail page to help create cohesive, fun group dynamics. Guests must be at least 18 years of age.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="w-full space-y-4">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.question}
            className="rounded-2xl border border-border/70 bg-white transition-all overflow-hidden shadow-xs"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-heading text-base sm:text-lg font-bold text-brand-navy">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-brand-coral transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-sm sm:text-base leading-relaxed text-muted-foreground animate-in fade-in-50 duration-150">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
