import * as React from "react";
import { Smile, Activity, Sprout, Users } from "lucide-react";

const METRICS = [
  {
    Icon: Smile,
    label: "Happier",
    text: "Close relationships are one of the strongest predictors of happiness.",
  },
  {
    Icon: Activity,
    label: "Healthier",
    text: "Social connection supports better mental and physical health.",
  },
  {
    Icon: Sprout,
    label: "More Fulfilled",
    text: "Meaningful relationships give greater purpose and a stronger sense of belonging.",
  },
  {
    Icon: Users,
    label: "More Resilient",
    text: "A supportive social network helps us navigate life's challenges.",
  },
];

/**
 * ConnectionMetrics section matching Base44 AboutPage —
 * 4 metric cards with circular coral badge outlines and "Our Belief" sage banner.
 */
export function ConnectionMetrics() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
        People who feel more connected are:
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ Icon, label, text }) => (
          <div key={label}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-coral/30 text-brand-coral">
              <Icon className="h-8 w-8" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-base font-bold text-[#1A2624]">{label}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#1A2624]/60">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#E0E2D9] p-6">
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-[#5C6B5A]" strokeWidth={1.8} />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5C6B5A]">
            Our Belief
          </p>
        </div>
        <p className="mt-3 font-heading text-2xl leading-snug text-[#1A2624]">
          Better things happen when we do them together
          <span className="text-[#F3A79C]">.</span>
        </p>
      </div>
    </div>
  );
}
