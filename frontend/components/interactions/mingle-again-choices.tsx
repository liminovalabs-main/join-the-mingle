"use client";

import React from "react";
import { AttendeeReviewCard } from "./attendee-review-card";
import { PublicProfile } from "@/types";

interface MingleAgainChoicesProps {
  attendees: PublicProfile[];
  selectedProfileIds: string[];
  onToggleProfile: (profileId: string, selected: boolean) => void;
  mingleId: string;
}

export function MingleAgainChoices({
  attendees,
  selectedProfileIds,
  onToggleProfile,
  mingleId,
}: MingleAgainChoicesProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 font-heading text-2xl font-black text-brand-navy">
        Who would you mingle with again?
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Only tap the people you'd genuinely like to see again. Your choices stay private, and we'll only connect you
        when they've chosen you too.
      </p>

      {attendees.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-white p-8 text-center text-xs text-muted-foreground shadow-xs">
          No other Minglers came to this one.
        </div>
      ) : (
        <div className="space-y-3">
          {attendees.map((person) => (
            <AttendeeReviewCard
              key={person.id}
              profile={person}
              isSelected={selectedProfileIds.includes(person.id)}
              onToggle={(selected) => onToggleProfile(person.id, selected)}
              mingleId={mingleId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
