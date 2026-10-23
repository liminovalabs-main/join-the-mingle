import * as React from "react";

/**
 * The signature "i" glyph: a coral dot (the Mingler's head) above a stem (the body).
 * This is the core Mingler brand mark — the dot of the "i" is a person.
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
 * The clean "mingler" wordmark for the header and footer.
 * Heavy, lowercase, confident — with the signature coral person glyph for the "i".
 */
export function MinglerLogo({
  className = "",
  size = "text-2xl md:text-3xl",
  dotClass = "bg-brand-coral",
  stemClass = "bg-brand-ivory",
}: {
  className?: string;
  size?: string;
  dotClass?: string;
  stemClass?: string;
}) {
  return (
    <MinglerWord
      className={`font-heading font-black lowercase tracking-tight text-brand-ivory leading-none ${size} ${className}`}
      dotClass={dotClass}
      stemClass={stemClass}
    >
      mingler
    </MinglerWord>
  );
}
