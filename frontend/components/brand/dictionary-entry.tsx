import * as React from "react";
import { MinglerWord } from "@/components/brand/mingler-logo";

interface DictionaryEntryProps {
  word?: string;
  phonetic?: string;
  part?: string;
  definition?: string;
  className?: string;
}

/**
 * An editorial dictionary definition — a signature Base44 brand device.
 * Used as quiet editorial moments between major sections.
 */
export function DictionaryEntry({
  word = "mingler",
  phonetic = "/ˈmɪŋ.ɡlər/",
  part = "noun",
  definition = "A person who thrives on real conversations in real rooms. Someone choosing physical tables and shared experiences over digital screens.",
  className = "",
}: DictionaryEntryProps) {
  return (
    <div className={`max-w-xl ${className}`}>
      <h3 className="font-heading font-black lowercase text-brand-navy text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none">
        <MinglerWord dotClass="bg-brand-coral" stemClass="bg-brand-navy">
          {word}
        </MinglerWord>
      </h3>
      <p className="mt-4 font-serif italic text-brand-navy/70 text-base md:text-lg tracking-wide">
        <span className="mr-2.5">{phonetic}</span>
        <span>{part}</span>
      </p>
      <div className="my-5 h-px w-14 bg-brand-coral/40" />
      <p className="text-brand-navy/85 text-lg sm:text-xl md:text-2xl leading-snug font-light">
        {definition}
      </p>
    </div>
  );
}
