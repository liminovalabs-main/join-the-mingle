import * as React from "react";

const GREEN = "#1F2E29";
const CORAL = "#F26C4F";
const SAGE = "#A3AC9F";
const SAGE_LIGHT = "#D9E1D5";
const BLUSH = "#F4D8CE";
const CREAM = "#FCFBF8";
const SCREEN = "#FDFBF7";

/**
 * Card 1 — JOIN: an oversized tilted phone is the hero, with the Mingler
 * wordmark + social sign-in over large organic shapes and abstract dots.
 * Matches exact Base44 vector artwork.
 */
export function JoinIllustration({ className = "w-full h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Join in seconds with your socials"
    >
      {/* large organic background shapes */}
      <path
        d="M36 72 C -6 150, 24 290, 124 340 C 220 388, 340 344, 376 250 C 406 168, 362 66, 268 48 C 196 34, 86 28, 36 72 Z"
        fill={SAGE_LIGHT}
      />
      <path
        d="M296 56 C 360 88, 392 184, 352 264 C 320 326, 236 344, 196 300 C 166 268, 188 196, 240 166 C 290 136, 268 76, 296 56 Z"
        fill={BLUSH}
      />

      {/* abstract dots — motif only */}
      <circle cx="58" cy="206" r="11" fill={CORAL} />
      <circle cx="352" cy="118" r="8" fill={GREEN} />
      <circle cx="344" cy="332" r="12" fill={SAGE} />
      <circle cx="66" cy="340" r="7" fill={CORAL} />

      {/* oversized tilted phone */}
      <g transform="rotate(-8 200 200)">
        <rect
          x="84"
          y="34"
          width="232"
          height="334"
          rx="44"
          fill={CREAM}
          stroke={GREEN}
          strokeWidth="7"
        />
        <rect x="104" y="62" width="192" height="278" rx="16" fill={SCREEN} />
        <rect x="182" y="46" width="36" height="6" rx="3" fill={GREEN} opacity="0.2" />

        {/* mingler wordmark */}
        <text
          x="200"
          y="126"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontWeight="900"
          fontSize="46"
          letterSpacing="-2"
          fill={GREEN}
        >
          mingler
        </text>
        {/* three dots above the i */}
        <circle cx="144" cy="96" r="4.6" fill={CORAL} />
        <circle cx="155" cy="93" r="4.6" fill={SAGE} />
        <circle cx="166" cy="96" r="4.6" fill={GREEN} />

        {/* social sign-in buttons */}
        <g>
          <rect
            x="118"
            y="152"
            width="164"
            height="40"
            rx="20"
            fill={CREAM}
            stroke={GREEN}
            strokeWidth="2"
          />
          <rect
            x="132"
            y="166"
            width="15"
            height="15"
            rx="4"
            fill="none"
            stroke={GREEN}
            strokeWidth="2"
          />
          <circle
            cx="139.5"
            cy="173.5"
            r="4"
            fill="none"
            stroke={GREEN}
            strokeWidth="1.8"
          />
          <circle cx="143.5" cy="169.5" r="1.3" fill={GREEN} />
          <text
            x="160"
            y="178"
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            fontSize="15"
            fill={GREEN}
          >
            Instagram
          </text>
        </g>
        <g>
          <rect
            x="118"
            y="200"
            width="164"
            height="40"
            rx="20"
            fill={CREAM}
            stroke={GREEN}
            strokeWidth="2"
          />
          <circle cx="139.5" cy="220" r="9.5" fill={GREEN} />
          <text
            x="139.5"
            y="225"
            textAnchor="middle"
            fontFamily="'Inter', sans-serif"
            fontWeight="700"
            fontSize="16"
            fill={CREAM}
          >
            f
          </text>
          <text
            x="158"
            y="225"
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            fontSize="15"
            fill={GREEN}
          >
            Facebook
          </text>
        </g>
        <g>
          <rect
            x="118"
            y="248"
            width="164"
            height="40"
            rx="20"
            fill={CREAM}
            stroke={GREEN}
            strokeWidth="2"
          />
          <circle cx="139.5" cy="268" r="9.5" fill={GREEN} />
          <text
            x="139.5"
            y="272"
            textAnchor="middle"
            fontFamily="'Inter', sans-serif"
            fontWeight="700"
            fontSize="12"
            fill={CREAM}
          >
            in
          </text>
          <text
            x="158"
            y="273"
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            fontSize="15"
            fill={GREEN}
          >
            LinkedIn
          </text>
        </g>

        {/* verify badge */}
        <circle cx="260" cy="308" r="13" fill={CORAL} />
        <path
          d="M254 308 l4 4 l8 -9"
          stroke={CREAM}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
