"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value?: number;
  onChange?: (val: number) => void;
  size?: number; // size in rem or px, or Tailwind size
  className?: string;
}

export function StarRating({
  value = 0,
  onChange,
  size = 4,
  className = "",
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const dimension = `${size * 4}px`;

  if (!onChange) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
        {stars.map((s) => (
          <Star
            key={s}
            style={{ width: dimension, height: dimension }}
            className={`shrink-0 ${
              s <= Math.round(value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
            strokeWidth={1.5}
          />
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-label={`${s} star${s > 1 ? "s" : ""}`}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            style={{ width: dimension, height: dimension }}
            className={`transition-colors ${
              s <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30 hover:text-amber-400/60"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </span>
  );
}
export default StarRating;
