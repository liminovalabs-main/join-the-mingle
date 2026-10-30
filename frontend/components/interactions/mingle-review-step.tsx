"use client";

import React from "react";
import { MessageSquare, Star } from "lucide-react";

interface RatingFieldProps {
  label: string;
  hint: string;
  value: number;
  onChange: (rating: number) => void;
  comment: string;
  onComment: (comment: string) => void;
}

function RatingField({
  label,
  hint,
  value,
  onChange,
  comment,
  onComment,
}: RatingFieldProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-xs">
      <div className="text-sm font-bold text-brand-navy">{label}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>

      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} out of 5 stars`}
            className="transition-transform hover:scale-110 cursor-pointer focus:outline-none"
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                n <= value
                  ? "fill-brand-coral text-brand-coral"
                  : "text-muted-foreground/30 hover:text-brand-coral/40"
              }`}
            />
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-navy/80">
          <MessageSquare className="h-3.5 w-3.5 text-brand-coral" /> Anything to add? (optional)
        </span>
        <textarea
          value={comment}
          onChange={(event) => onComment(event.target.value)}
          rows={3}
          placeholder="A short note…"
          className="w-full resize-none rounded-xl border border-border/70 bg-brand-ivory/20 px-3.5 py-2.5 text-xs text-brand-navy placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-coral/40"
        />
      </label>
    </div>
  );
}

export interface MingleReviewStepProps {
  venueRating: number;
  venueComment: string;
  experienceRating: number;
  experienceComment: string;
  onChange: (update: {
    venueRating?: number;
    venueComment?: string;
    experienceRating?: number;
    experienceComment?: string;
  }) => void;
}

export function MingleReviewStep({
  venueRating,
  venueComment,
  experienceRating,
  experienceComment,
  onChange,
}: MingleReviewStepProps) {
  return (
    <section>
      <h2 className="mb-1 font-heading text-2xl font-black text-brand-navy">
        How was your Mingle?
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Rate the venue and the experience. Both are private to Mingler and help us curate better mingles.
      </p>

      <div className="space-y-4">
        <RatingField
          label="The venue"
          hint="The setting, comfort and facilities."
          value={venueRating}
          onChange={(value) => onChange({ venueRating: value })}
          comment={venueComment}
          onComment={(value) => onChange({ venueComment: value })}
        />

        <RatingField
          label="Overall experience"
          hint="The organisation, hosting and how much you enjoyed the mingle."
          value={experienceRating}
          onChange={(value) => onChange({ experienceRating: value })}
          comment={experienceComment}
          onComment={(value) => onChange({ experienceComment: value })}
        />
      </div>
    </section>
  );
}
