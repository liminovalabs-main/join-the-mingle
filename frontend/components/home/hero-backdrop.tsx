import * as React from "react";
import Image from "next/image";

const HERO_IMAGE =
  "https://media.base44.com/images/public/6ab24cde0395ca67b11cfcd9/d2af60c89_generated_image.png";

/**
 * Full-bleed atmospheric photography behind the navy hero, faded into the
 * brand colour so the statement type stays dominant.
 * Exact Base44 hero background treatment.
 */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="h-full w-full object-cover object-center opacity-45"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-navy/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-brand-navy/70" />
    </div>
  );
}
