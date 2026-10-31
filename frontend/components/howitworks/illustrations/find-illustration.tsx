import * as React from "react";

const GREEN = "#1F2E29";
const CORAL = "#F26C4F";
const SAGE = "#A3AC9F";
const SAGE_LIGHT = "#D9E1D5";
const BLUSH = "#F4D8CE";
const CREAM = "#FCFBF8";

/**
 * Card 2 — FIND: four large editorial OBJECTS (dine, play, create, learn)
 * on bold coloured shapes. Matches exact Base44 vector artwork.
 */
export function FindIllustration({ className = "w-full h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Find your mingle across experiences"
    >
      {/* DINE — top left */}
      <circle cx="100" cy="102" r="82" fill={SAGE_LIGHT} />
      <circle cx="100" cy="102" r="54" fill={CREAM} stroke={GREEN} strokeWidth="3" />
      <circle cx="80" cy="94" r="16" fill="none" stroke={GREEN} strokeWidth="2.5" />
      <circle cx="120" cy="110" r="16" fill="none" stroke={GREEN} strokeWidth="2.5" />
      <circle cx="80" cy="94" r="6" fill={CORAL} />
      <circle cx="120" cy="110" r="6" fill={SAGE} />
      <text
        x="100"
        y="206"
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill={GREEN}
      >
        dine
      </text>

      {/* PLAY — top right */}
      <circle cx="300" cy="102" r="82" fill={BLUSH} />
      <g transform="rotate(-22 300 102)">
        <ellipse cx="296" cy="86" rx="28" ry="36" fill={GREEN} />
        <circle cx="288" cy="78" r="3" fill={CREAM} />
        <circle cx="300" cy="86" r="3" fill={CREAM} />
        <circle cx="292" cy="94" r="3" fill={CREAM} />
        <rect x="290" y="120" width="13" height="34" rx="6.5" fill={GREEN} />
      </g>
      <circle cx="338" cy="150" r="12" fill={CORAL} />
      <text
        x="300"
        y="206"
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill={GREEN}
      >
        play
      </text>

      {/* CREATE — bottom left */}
      <circle cx="100" cy="298" r="82" fill={BLUSH} />
      <line
        x1="62"
        y1="356"
        x2="92"
        y2="258"
        stroke={GREEN}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="138"
        y1="356"
        x2="108"
        y2="258"
        stroke={GREEN}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="78"
        y1="302"
        x2="122"
        y2="302"
        stroke={GREEN}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <rect
        x="72"
        y="254"
        width="56"
        height="46"
        rx="4"
        fill={CREAM}
        stroke={GREEN}
        strokeWidth="3"
      />
      <circle cx="92" cy="272" r="9" fill={CORAL} />
      <rect x="86" y="284" width="24" height="9" rx="2" fill={SAGE} />
      <line
        x1="140"
        y1="286"
        x2="160"
        y2="264"
        stroke={GREEN}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect
        x="154"
        y="258"
        width="9"
        height="11"
        rx="2"
        fill={CORAL}
        transform="rotate(45 158 263)"
      />
      <text
        x="100"
        y="396"
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill={GREEN}
      >
        create
      </text>

      {/* LEARN — bottom right */}
      <circle cx="300" cy="298" r="82" fill={SAGE_LIGHT} />
      <ellipse cx="300" cy="352" rx="62" ry="16" fill={SAGE} opacity="0.6" />
      <line
        x1="300"
        y1="352"
        x2="300"
        y2="244"
        stroke={GREEN}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path d="M300 246 l26 9 l-26 9 z" fill={CORAL} />
      <circle cx="300" cy="352" r="8" fill={CREAM} stroke={GREEN} strokeWidth="2.5" />
      <text
        x="300"
        y="396"
        textAnchor="middle"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="32"
        fill={GREEN}
      >
        learn
      </text>
    </svg>
  );
}
