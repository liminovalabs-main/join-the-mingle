import * as React from "react";

/**
 * WhoWeAre section matching Base44 AboutPage —
 * Meriam & KJ's story and founding vision for Mingler.
 */
export function WhoWeAre() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
        Who We Are
      </p>
      <h2 className="mt-5 font-heading text-4xl md:text-5xl leading-[1.08] tracking-tight text-[#1A2624]">
        Built by people who like people
        <span className="text-[#F3A79C]">.</span>
      </h2>

      <div className="mt-6 space-y-4 leading-relaxed text-[#1A2624]/70">
        <p className="font-semibold text-[#1A2624]">
          We&rsquo;ve been friends since we were 15.
        </p>
        <p>
          Between us we&rsquo;ve moved cities, changed jobs, become parents, and
          watched the friendships that once happened naturally start to take more
          effort.
        </p>
        <p>
          Mingler is our answer to that &mdash; a way to meet new people by doing things
          you actually enjoy, in real life, in London.
        </p>
      </div>

      <div className="mt-8 flex gap-10">
        <div>
          <p className="font-serif italic text-3xl text-[#1A2624] tracking-wide">Meriam</p>
          <p className="mt-2 text-sm font-bold text-[#1A2624]">Meriam Makiya</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D8D8D]">
            Founder
          </p>
        </div>
        <div>
          <p className="font-serif italic text-3xl text-[#1A2624] tracking-wide">KJ</p>
          <p className="mt-2 text-sm font-bold text-[#1A2624]">KJ</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D8D8D]">
            Co-Founder
          </p>
        </div>
      </div>
    </div>
  );
}
