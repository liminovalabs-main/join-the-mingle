import * as React from "react";

const NAVY = "#142232";
const CORAL = "#E05A47";

/**
 * Card 4 — MINGLE AGAIN: two large overlapping circles (a connection made — minglers connected!)
 * Plain white background per client request, no dating heart metaphors.
 */
export function MingleAgainIllustration({
  className = "w-full h-auto",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={className}
      role="img"
      aria-label="minglers connected — reconnect after the event"
    >
      <defs>
        <clipPath id="mingle-circle-left">
          <circle cx="165" cy="150" r="88" />
        </clipPath>
      </defs>

      {/* Pure plain white background per client feedback */}
      <rect width="400" height="320" fill="#FFFFFF" rx="16" />

      {/* Left Circle — Navy */}
      <circle cx="165" cy="150" r="88" fill={NAVY} />

      {/* Right Circle — Coral */}
      <circle cx="235" cy="150" r="88" fill={CORAL} />

      {/* Overlapping intersection */}
      <circle
        cx="235"
        cy="150"
        r="88"
        fill="#F49588"
        clipPath="url(#mingle-circle-left)"
      />

      {/* Circular coral brand dots */}
      <circle cx="70" cy="80" r="6" fill={CORAL} opacity="0.6" />
      <circle cx="330" cy="80" r="6" fill={CORAL} opacity="0.6" />
      <circle cx="60" cy="240" r="5" fill={NAVY} opacity="0.3" />
      <circle cx="340" cy="240" r="5" fill={NAVY} opacity="0.3" />

      <text
        x="200"
        y="285"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="17"
        letterSpacing="0.05em"
        fill={NAVY}
      >
        minglers connected !
      </text>
    </svg>
  );
}
