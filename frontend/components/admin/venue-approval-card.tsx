"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, CheckCircle2, Clock, Loader2, MapPin, User, X } from "lucide-react";
import { VenueApprovalItem } from "@/types/admin";
import { decideVenue } from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VenueApprovalCardProps {
  venue: VenueApprovalItem;
  onDecided?: (id: string, action: "approve" | "reject") => void;
}

export function VenueApprovalCard({ venue, onDecided }: VenueApprovalCardProps) {
  const [processing, setProcessing] = React.useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setProcessing(action);
    try {
      await decideVenue(venue.id, action);
      toast.success(
        action === "approve"
          ? `Venue "${venue.name}" has been approved and published live!`
          : `Venue application "${venue.name}" has been rejected.`
      );
      if (onDecided) {
        onDecided(venue.id, action);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      toast.error(msg);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-brand-navy/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex flex-col md:flex-row">
        {/* Venue Cover Image */}
        <div className="relative h-48 md:h-auto md:w-64 shrink-0 bg-brand-navy/5">
          {venue.hero_image ? (
            <Image
              src={venue.hero_image}
              alt={venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-brand-navy/30 gap-2 p-6">
              <MapPin className="w-8 h-8" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                No Photo Provided
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-brand-navy/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
              {venue.category}
            </Badge>
          </div>
        </div>

        {/* Content & Details */}
        <div className="p-6 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold font-serif text-brand-navy">
                {venue.name}
              </h3>
              <p className="text-xs text-brand-navy/70 flex items-center gap-1.5 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                <span>
                  {venue.address}, {venue.postcode} • {venue.area}
                </span>
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              Pending Approval
            </span>
          </div>

          {/* Description */}
          {venue.description && (
            <p className="text-xs text-brand-navy/70 leading-relaxed bg-brand-ivory/40 p-3.5 rounded-2xl border border-brand-navy/5">
              {venue.description}
            </p>
          )}

          {/* Manager Info & Submission Date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-brand-navy/60 pt-1 border-t border-brand-navy/10">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-brand-coral" />
              Manager: {venue.manager_name || "Applicant"} (
              <span className="font-semibold text-brand-navy">{venue.manager_email}</span>)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-coral" />
              Applied: {formatDate(venue.created_at)}
            </span>
          </div>

          {/* Decision Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAction("reject")}
              disabled={processing !== null}
              className="rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold uppercase tracking-wider text-xs px-5 py-2.5 transition-all"
            >
              {processing === "reject" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Rejecting...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Reject
                </span>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handleAction("approve")}
              disabled={processing !== null}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs px-6 py-2.5 shadow-md active:scale-95 transition-all"
            >
              {processing === "approve" ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Approving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Approve Venue
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
