"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  verified?: boolean;
  className?: string;
}

export function VerifiedBadge({ verified, className = "" }: VerifiedBadgeProps) {
  if (!verified) return null;
  return (
    <span
      className={`inline-flex items-center text-brand-coral align-middle ${className}`}
      title="Age verified (18+)"
      aria-label="Age verified"
    >
      <BadgeCheck className="w-5 h-5 fill-brand-coral/15" />
    </span>
  );
}
