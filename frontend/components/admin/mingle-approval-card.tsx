"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  Clock,
  Edit3,
  Loader2,
  MapPin,
  MessageSquare,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { MingleApprovalItem } from "@/types/admin";
import { decideMingle } from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/utils/format";
import { resolveCategoryHeroImage } from "@/lib/constants/images";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MingleApprovalCardProps {
  mingle: MingleApprovalItem;
  onDecided?: (
    id: string,
    action: "approve" | "changes_requested" | "reject"
  ) => void;
}

export function MingleApprovalCard({
  mingle,
  onDecided,
}: MingleApprovalCardProps) {
  const [processing, setProcessing] = React.useState<
    "approve" | "changes_requested" | "reject" | null
  >(null);
  const [changesModalOpen, setChangesModalOpen] = React.useState(false);
  const [curatorNotesInput, setCuratorNotesInput] = React.useState(
    mingle.curator_notes || ""
  );

  const heroImg = resolveCategoryHeroImage(
    mingle.experience_type,
    mingle.hero_image
  );

  const handleSimpleAction = async (action: "approve" | "reject") => {
    setProcessing(action);
    try {
      await decideMingle(mingle.id, action);
      toast.success(
        action === "approve"
          ? `Mingle "${mingle.title}" approved and published live!`
          : `Mingle "${mingle.title}" rejected.`
      );
      if (onDecided) {
        onDecided(mingle.id, action);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      toast.error(msg);
    } finally {
      setProcessing(null);
    }
  };

  const handleRequestChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curatorNotesInput.trim()) {
      toast.error("Please enter feedback notes describing the requested modifications.");
      return;
    }

    setProcessing("changes_requested");
    try {
      await decideMingle(mingle.id, "changes_requested", curatorNotesInput.trim());
      toast.success(`Feedback communicated to venue for "${mingle.title}".`);
      setChangesModalOpen(false);
      if (onDecided) {
        onDecided(mingle.id, "changes_requested");
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      toast.error(msg);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
      <div className="rounded-3xl bg-white border border-brand-navy/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex flex-col md:flex-row">
          {/* Experience Cover Image */}
          <div className="relative h-48 md:h-auto md:w-64 shrink-0 bg-brand-navy/5">
            <Image
              src={heroImg}
              alt={mingle.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge className="bg-brand-navy/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                {mingle.experience_type}
              </Badge>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="p-6 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold font-serif text-brand-navy">
                  {mingle.title}
                </h3>
                <p className="text-xs text-brand-navy/70 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                  <span>
                    Venue: <strong className="text-brand-navy">{mingle.venue_name}</strong> ({mingle.venue_area})
                  </span>
                </p>
              </div>

              {mingle.status === "changes_requested" ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Changes Requested
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Submitted for Review
                </span>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-brand-navy/70">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-coral" />
                {formatDate(mingle.event_date)}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-coral" />
                {formatTime(mingle.start_time)} ({mingle.duration_minutes}m)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Ticket className="w-3.5 h-3.5 text-brand-coral" />
                £{parseFloat(mingle.ticket_price || "0").toFixed(2)} / ticket
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-brand-coral" />
                {mingle.capacity} capacity • Ages {mingle.age_min}–{mingle.age_max}
              </span>
            </div>

            {/* Description */}
            {mingle.description && (
              <p className="text-xs text-brand-navy/70 leading-relaxed bg-brand-ivory/40 p-3.5 rounded-2xl border border-brand-navy/5">
                {mingle.description}
              </p>
            )}

            {/* Existing Curator Feedback Banner if previously reviewed */}
            {mingle.curator_notes && (
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-3.5 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Current Curator Feedback to Venue</span>
                </div>
                <p className="text-amber-800 leading-relaxed pl-5">
                  &ldquo;{mingle.curator_notes}&rdquo;
                </p>
              </div>
            )}

            {/* Decision Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSimpleAction("reject")}
                disabled={processing !== null}
                className="rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold uppercase tracking-wider text-xs px-4 py-2 transition-all"
              >
                {processing === "reject" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setChangesModalOpen(true)}
                disabled={processing !== null}
                className="rounded-full border-amber-300 text-amber-800 hover:bg-amber-50 font-bold uppercase tracking-wider text-xs px-4 py-2 transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Request Changes
                </span>
              </Button>

              <Button
                type="button"
                onClick={() => handleSimpleAction("approve")}
                disabled={processing !== null}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs px-5 py-2 shadow-md active:scale-95 transition-all"
              >
                {processing === "approve" ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Publishing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Approve & Publish Live
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Changes Modal Dialog */}
      <Dialog open={changesModalOpen} onOpenChange={setChangesModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8 bg-white border border-brand-navy/10 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold font-serif text-brand-navy">
              Request Changes from Venue
            </DialogTitle>
            <DialogDescription className="text-xs text-brand-navy/70 leading-relaxed">
              Provide actionable guidance for the venue manager regarding &ldquo;{mingle.title}&rdquo; (e.g. ticket price calibration, date adjustment, or description clarity).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestChangesSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                Curator Feedback Notes <span className="text-brand-coral">*</span>
              </label>
              <textarea
                value={curatorNotesInput}
                onChange={(e) => setCuratorNotesInput(e.target.value)}
                placeholder="e.g. Please update ticket price to include the welcome Prosecco glass, and adjust start time to 19:30 for guest arrival flow."
                rows={4}
                required
                className="w-full rounded-2xl border border-brand-navy/15 bg-white p-4 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral leading-relaxed resize-none"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setChangesModalOpen(false)}
                className="rounded-full text-xs font-bold text-brand-navy/60 hover:text-brand-navy"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing === "changes_requested"}
                className="rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold uppercase tracking-wider text-xs px-6 py-2.5 shadow-md"
              >
                {processing === "changes_requested" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting Notes...
                  </span>
                ) : (
                  "Send Notes to Venue"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
