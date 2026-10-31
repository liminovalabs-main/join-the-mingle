import * as React from "react";

const GREEN = "#1F2E29";
const CORAL = "#F26C4F";
const SAGE = "#A3AC9F";
const SAGE_LIGHT = "#D9E1D5";
const BLUSH = "#F4D8CE";
const CREAM = "#FCFBF8";

/**
 * Card 4 — MINGLE AGAIN: two large overlapping circles (a connection made)
 * with a coral heart between them and a dotted link. Matches exact Base44 vector artwork.
 */
export function MingleAgainIllustration({
  className = "w-full h-auto",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Mingle again — reconnect after the event"
    >
      {/* soft background blobs */}
      <path
        d="M44 120 C 12 200, 56 320, 150 340 C 240 358, 330 300, 356 210 C 378 132, 326 60, 236 56 C 160 52, 76 60, 44 120 Z"
        fill={SAGE_LIGHT}
      />
      <path
        d="M300 70 C 360 110, 388 200, 348 280 C 316 340, 232 350, 196 300 C 168 262, 196 196, 248 176 C 296 158, 276 92, 300 70 Z"
        fill={BLUSH}
      />

      {/* dotted connection trail */}
      <path
        d="M120 250 Q200 210 280 250"
        fill="none"
        stroke={CORAL}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.7"
      />

      {/* left circle — green */}
      <circle cx="138" cy="232" r="74" fill={GREEN} />
      <circle cx="138" cy="232" r="74" fill="none" stroke={GREEN} strokeWidth="3" />
      {/* right circle — coral */}
      <circle cx="262" cy="232" r="74" fill={CORAL} />

      {/* heart between them */}
      <path
        d="M200 236 C 192 222, 172 222, 172 240 C 172 256, 200 270, 200 270 C 200 270, 228 256, 228 240 C 228 222, 208 222, 200 236 Z"
        fill={CREAM}
        stroke={GREEN}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* abstract dots — motif only */}
      <circle cx="60" cy="120" r="8" fill={CORAL} />
      <circle cx="346" cy="118" r="7" fill={GREEN} />
      <circle cx="70" cy="340" r="9" fill={SAGE} />
      <circle cx="338" cy="338" r="8" fill={CORAL} />

      <text
        x="200"
        y="372"
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill={GREEN}
      >
        again
      </text>
    </svg>
  );
}
