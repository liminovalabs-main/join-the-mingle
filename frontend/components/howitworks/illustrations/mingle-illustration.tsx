import * as React from "react";

const GREEN = "#1F2E29";
const CORAL = "#F26C4F";
const SAGE = "#A3AC9F";
const SAGE_LIGHT = "#D9E1D5";
const BLUSH = "#F4D8CE";

/**
 * Card 3 — MINGLE (hero): a bold abstract overhead social composition.
 * A large organic table with glasses/plates, surrounded by large overlapping
 * circles representing people converging. Matches exact Base44 vector artwork.
 */
export function MingleIllustration({ className = "w-full h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Show up and mingle together"
    >
      {/* converging dotted trails */}
      <path
        d="M28 58 Q120 140 178 188"
        fill="none"
        stroke={CORAL}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.6"
      />
      <path
        d="M374 52 Q280 140 222 188"
        fill="none"
        stroke={SAGE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.6"
      />
      <path
        d="M40 372 Q132 300 182 232"
        fill="none"
        stroke={CORAL}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.6"
      />
      <path
        d="M368 366 Q280 300 220 232"
        fill="none"
        stroke={GREEN}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity="0.5"
      />

      {/* large organic table */}
      <path
        d="M96 210 C 96 150, 140 118, 200 118 C 262 118, 304 150, 304 210 C 304 272, 262 302, 200 302 C 140 302, 96 272, 96 210 Z"
        fill={SAGE_LIGHT}
      />
      <path
        d="M96 206 C 96 148, 140 116, 200 116 C 262 116, 304 148, 304 206 C 304 270, 262 300, 200 300 C 140 300, 96 270, 96 206 Z"
        fill="none"
        stroke={GREEN}
        strokeWidth="3"
        opacity="0.4"
      />

      {/* objects on the table */}
      <circle cx="168" cy="196" r="19" fill="none" stroke={GREEN} strokeWidth="3" opacity="0.5" />
      <circle cx="232" cy="222" r="19" fill="none" stroke={GREEN} strokeWidth="3" opacity="0.5" />
      <circle cx="168" cy="196" r="7" fill={CORAL} />
      <circle cx="232" cy="222" r="7" fill={SAGE} />
      <circle cx="200" cy="234" r="6" fill={GREEN} />

      {/* large overlapping circles — the group converging */}
      <circle cx="200" cy="106" r="44" fill={GREEN} />
      <circle cx="102" cy="146" r="40" fill={CORAL} />
      <circle cx="298" cy="146" r="40" fill={SAGE} />
      <circle cx="62" cy="238" r="42" fill={BLUSH} stroke={GREEN} strokeWidth="3" />
      <circle cx="338" cy="238" r="42" fill={CORAL} />
      <circle cx="136" cy="320" r="44" fill={SAGE} />
      <circle cx="264" cy="320" r="44" fill={GREEN} />
      <circle cx="200" cy="350" r="38" fill={BLUSH} stroke={GREEN} strokeWidth="3" />

      {/* abstract dots — motif only */}
      <circle cx="48" cy="120" r="8" fill={CORAL} />
      <circle cx="356" cy="112" r="7" fill={GREEN} />
      <circle cx="46" cy="300" r="9" fill={SAGE} />
      <circle cx="354" cy="300" r="8" fill={CORAL} />
    </svg>
  );
}
