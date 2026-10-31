import * as React from "react";
import Image from "next/image";

const IMAGE =
  "https://media.base44.com/images/public/6ab24cde0395ca67b11cfcd9/b20d3819a_generated_image.png";

/**
 * Full-bleed lifestyle band matching Base44 AboutPage —
 * edge-to-edge photography with the section headline set over the photography.
 */
export function AboutLifestyleImage() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/9]">
      <Image
        src={IMAGE}
        alt="Minglers laughing together while painting at a London art studio"
        fill
        priority
        className="h-full w-full object-cover"
        sizes="100vw"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-6xl px-5 pb-8 md:pb-12">
          <h2 className="max-w-3xl font-heading text-3xl leading-[1.05] tracking-tight text-brand-ivory sm:text-4xl md:text-5xl">
            Real connection leads to a happier, healthier life
            <span className="text-brand-coral">.</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
