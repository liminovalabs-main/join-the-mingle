import * as React from "react";
import Image from "next/image";

/**
 * The official Mingler overlapping circles mark:
 * Two overlapping circular disks (Navy on the left, Coral on the right, blended rose intersection).
 */
export function OverlappingCirclesMark({
  className = "h-6 w-auto aspect-[3/2] shrink-0",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left Navy Circle */}
      <circle cx="34" cy="32" r="28" fill="#142232" />
      {/* Right Coral Circle */}
      <circle cx="62" cy="32" r="28" fill="#E05A47" />
      {/* Intersection Lens */}
      <path
        d="M 48 7.75 A 28 28 0 0 1 48 56.25 A 28 28 0 0 1 48 7.75 Z"
        fill="#DE8287"
      />
    </svg>
  );
}

/**
 * The signature "i" glyph: a circular coral dot above a stem.
 * Sized in em units so it scales dynamically with the inherited font size.
 */
export function IGlyph({
  dotClass = "bg-brand-coral",
  stemClass = "bg-brand-ivory",
}: {
  dotClass?: string;
  stemClass?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block align-baseline"
      style={{ width: "0.16em", height: "0.72em", marginRight: "0.01em" }}
    >
      <span
        className={`absolute rounded-full ${dotClass}`}
        style={{
          left: "50%",
          top: "0",
          transform: "translateX(-50%)",
          width: "0.2em",
          height: "0.2em",
        }}
      />
      <span
        className={`absolute rounded-full ${stemClass}`}
        style={{
          left: "50%",
          bottom: "0",
          transform: "translateX(-50%)",
          width: "0.1em",
          height: "0.44em",
        }}
      />
    </span>
  );
}

/**
 * Renders a word with its first "i" replaced by the Mingler human glyph.
 */
export function MinglerWord({
  children,
  className = "",
  dotClass = "bg-brand-coral",
  stemClass = "bg-brand-ivory",
}: {
  children: React.ReactNode;
  className?: string;
  dotClass?: string;
  stemClass?: string;
}) {
  const text = String(children);
  const idx = text.indexOf("i");
  if (idx === -1) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.slice(0, idx)}
      <IGlyph dotClass={dotClass} stemClass={stemClass} />
      {text.slice(idx + 1)}
    </span>
  );
}

/**
 * The official client plain inverted logo for dark/blue backgrounds.
 * Uses the exact graphic asset provided by the client with authentic proportions.
 */
export function MinglerPlainLogo({
  className = "",
  heightClass = "h-7 sm:h-8",
  priority = true,
}: {
  className?: string;
  heightClass?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src="/images/brand/mingler-logo-transparent.png"
        alt="mingler"
        width={136}
        height={47}
        priority={priority}
        className={`${heightClass} w-auto object-contain select-none`}
      />
    </div>
  );
}

/**
 * The clean "mingler" wordmark.
 * Always lowercase "mingler", with a circular coral dot only on the 'i'.
 * No trailing period per client brand directive.
 */
export function MinglerLogo({
  className = "",
  size = "text-2xl md:text-3xl",
  showMark = false,
  useImage = false,
  dotClass = "bg-brand-coral",
  stemClass = "bg-brand-ivory",
}: {
  className?: string;
  size?: string;
  showMark?: boolean;
  useImage?: boolean;
  dotClass?: string;
  stemClass?: string;
}) {
  if (useImage) {
    return <MinglerPlainLogo className={className} />;
  }

  return (
    <div
      className={`font-heading font-black text-brand-ivory inline-flex items-center gap-2.5 leading-none select-none ${className}`}
    >
      {showMark && <OverlappingCirclesMark className="h-6 sm:h-7 w-auto shrink-0" />}
      <span className={`lowercase tracking-tight ${size}`}>
        <MinglerWord dotClass={dotClass} stemClass={stemClass}>
          mingler
        </MinglerWord>
      </span>
    </div>
  );
}

