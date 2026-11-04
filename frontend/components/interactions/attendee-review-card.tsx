"use client";

import { Check } from "lucide-react";
import { OverlappingCirclesMark } from "@/components/brand/mingler-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReportDialog } from "./report-dialog";
import { PublicProfile } from "@/types";
import { calcAgeGroupFromDob, calcAgeGroup } from "@/lib/utils/age";

interface AttendeeReviewCardProps {
  profile: PublicProfile;
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  mingleId: string;
}

export function AttendeeReviewCard({
  profile,
  isSelected,
  onToggle,
  mingleId,
}: AttendeeReviewCardProps) {
  const firstName = profile.display_name?.split(" ")[0] || "Mingler";

  const demographicAge =
    (profile as unknown as { date_of_birth?: string }).date_of_birth
      ? calcAgeGroupFromDob((profile as unknown as { date_of_birth?: string }).date_of_birth)
      : (profile as unknown as { age?: number }).age
      ? calcAgeGroup((profile as unknown as { age?: number }).age)
      : null;

  const meta = [demographicAge, profile.gender].filter(Boolean).join(" · ");

  const initials = profile.display_name
    ? profile.display_name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "M";

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isSelected
          ? "border-brand-coral bg-brand-coral/5"
          : "border-border/70 bg-white shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0 rounded-full border border-border/80">
          <AvatarImage
            src={profile.photo || undefined}
            alt={profile.display_name}
            className="aspect-square object-cover"
          />
          <AvatarFallback className="bg-brand-stone/30 font-bold text-xs text-brand-navy">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-sm font-bold text-brand-navy">
            {firstName}
          </div>
          {meta && <div className="truncate text-xs text-muted-foreground">{meta}</div>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggle(!isSelected)}
        aria-pressed={isSelected}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs sm:text-sm font-bold tracking-wide transition-colors cursor-pointer ${
          isSelected
            ? "bg-brand-coral text-white shadow-sm"
            : "border border-brand-coral/50 text-brand-coral hover:bg-brand-coral/10"
        }`}
      >
        {isSelected ? (
          <>
            <Check className="h-4 w-4" />
            <span>You'd mingle with them again</span>
          </>
        ) : (
          <>
            <OverlappingCirclesMark className="h-4 w-auto" />
            <span>I'd mingle with them again</span>
          </>
        )}
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-muted-foreground">
          Only tap this if you'd genuinely like to see them again.
        </p>
        <ReportDialog
          profileId={profile.id}
          profileName={firstName}
          mingleId={mingleId}
          defaultReason="Safety concern"
        />
      </div>
    </div>
  );
}
