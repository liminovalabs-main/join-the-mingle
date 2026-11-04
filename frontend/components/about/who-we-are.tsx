import * as React from "react";

/**
 * WhoWeAre section —
 * Meriam & KJ's authentic story and founding vision for mingler.
 */
export function WhoWeAre() {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8D8D8D]">
        Who We Are
      </p>
      <h2 className="mt-4 font-heading text-4xl md:text-5xl leading-[1.08] tracking-tight text-[#1A2624] font-extrabold">
        Built by people who like people
        <span className="text-brand-coral">.</span>
      </h2>

      <div className="mt-6 space-y-4 text-base sm:text-lg leading-relaxed text-[#1A2624]/80">
        <p className="font-bold text-[#1A2624]">
          We&rsquo;ve been good friends since we were 15.
        </p>
        <p>
          We&rsquo;re Meriam and KJ, and friendship has always been a big part of our lives. We&rsquo;re lucky to have a close circle of friends, many of whom we&rsquo;ve known since we were young. We know how much those connections matter.
        </p>
        <p>
          But even with a good social circle, it&rsquo;s easy to fall into the same routine: the same plans, the same places, the same faces. We wanted to try different things and meet new people along the way. And we kept hearing the same thing from friends&mdash;including single friends who were finding it hard to meet people beyond a screen.
        </p>
        <p className="font-semibold text-brand-navy">
          That&rsquo;s where mingler began.
        </p>
        <p>
          We wanted to bring people together through things they&rsquo;d actually enjoy doing. A chance to have fun, try something different and make connections naturally, without the pressure of having to turn up and &ldquo;make friends&rdquo;.
        </p>
        <p>
          Come on your own, with a friend or with your partner. You might meet a new friendship group, someone you&rsquo;d like to work with, or simply someone who makes an already good evening even better.
        </p>
        <p>
          We&rsquo;re starting in London, with plans to give people the opportunity to host their own activities as mingler grows.
        </p>
        <p className="font-medium text-[#1A2624]">
          For us, it comes back to something simple: spending time with people and having something to look forward to.
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-border/60">
        <p className="font-serif italic text-2xl sm:text-3xl text-brand-navy">
          Meriam &amp; KJ
        </p>
      </div>
    </div>
  );
}
