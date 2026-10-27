"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/profile/verified-badge";
import { calcAgeGroupFromDob, calcAgeGroup } from "@/lib/utils/age";
import { PrivateProfile, PublicProfile } from "@/types/auth";

interface ProfileSummaryCardProps {
  profile?: PrivateProfile | PublicProfile | null;
  onEdit?: () => void;
  className?: string;
}

export function ProfileSummaryCard({
  profile,
  onEdit,
  className = "",
}: ProfileSummaryCardProps) {
  if (!profile) return null;

  // Derive Base44 demographic age group
  const ageGroup =
    profile.age_group ||
    ("date_of_birth" in profile && profile.date_of_birth
      ? calcAgeGroupFromDob(profile.date_of_birth)
      : "");

  const formatName = (name?: string) => {
    if (!name) return "Member";
    const parts = name.trim().split(/\s+/);
    const prefixes = ["md.", "md", "dr.", "dr", "mr.", "mr", "ms.", "ms", "mrs.", "mrs", "prof.", "prof"];
    if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  const firstName = formatName(profile.display_name);
  const isVerified = "is_age_verified" in profile ? profile.is_age_verified : false;

  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <div
      className={`rounded-3xl bg-white border border-border/70 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs ${className}`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-24 w-24 border-2 border-brand-coral/40 shadow-sm aspect-square">
          {profile.photo && (
            <AvatarImage
              src={profile.photo}
              alt={profile.display_name || "Profile"}
              className="object-cover w-full h-full"
            />
          )}
          <AvatarFallback className="text-2xl font-black bg-brand-coral/15 text-brand-coral">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 text-center sm:text-left min-w-0">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <h2 className="font-heading text-3xl font-black text-brand-navy leading-none truncate">
            {firstName}
          </h2>
          <VerifiedBadge verified={isVerified} />
        </div>

        <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-x-2 gap-y-1 text-sm text-muted-foreground font-medium">
          {ageGroup && <span>{ageGroup}</span>}
          {profile.gender && <span>&middot; {profile.gender}</span>}
          {profile.relationship_status && <span>&middot; {profile.relationship_status}</span>}
        </div>

        {!isVerified && (
          <p className="mt-2 text-xs font-semibold text-brand-coral/85">
            Age verification pending
          </p>
        )}
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-navy/20 text-brand-navy text-sm font-semibold hover:bg-brand-coral/10 hover:border-brand-coral hover:text-brand-coral transition-colors cursor-pointer shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit profile</span>
        </button>
      )}
    </div>
  );
}

export default ProfileSummaryCard;
