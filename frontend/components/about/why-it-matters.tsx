import * as React from "react";

/**
 * Why It Matters section matching Base44 AboutPage —
 * Research citation from the Global Flourishing Study.
 */
export function WhyItMatters() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
        Why it Matters
      </p>
      <div className="mt-5 max-w-3xl space-y-4 leading-relaxed text-[#1A2624]/70">
        <p>
          Research increasingly points to something remarkably simple: the quality
          of our relationships matters to how well we live.
        </p>
        <p>
          The Global Flourishing Study, involving more than 200,000 people across 22
          countries, identifies close social relationships as one of the core
          components of human flourishing, alongside happiness, health, meaning and
          purpose.
        </p>
      </div>
    </div>
  );
}
