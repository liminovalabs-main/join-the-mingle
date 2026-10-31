import * as React from "react";
import Image from "next/image";

const PHOTO =
  "https://media.base44.com/images/public/6ab24cde0395ca67b11cfcd9/4aad86169_ChatGPTImageSep29202610_12_59AM.png";

/**
 * FounderPhoto component matching Base44 AboutPage —
 * Polarized card displaying Meriam and KJ.
 */
export function FounderPhoto() {
  return (
    <div className="w-full max-w-xs rounded-[2rem] bg-white p-3 shadow-[0_24px_60px_-30px_rgba(26,38,36,0.35)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem]">
        <Image
          src={PHOTO}
          alt="Meriam and KJ, founders of Mingler"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 320px"
        />
      </div>
    </div>
  );
}
