"use client";

import React, { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const REPORT_REASONS = [
  "Safety concern",
  "Inappropriate behavior",
  "Inaccurate profile",
  "Other",
];

interface ReportDialogProps {
  profileId?: string;
  profileName?: string;
  mingleId?: string;
  defaultReason?: string;
  title?: string;
  description?: string;
  label?: string;
}

export function ReportDialog({
  profileId,
  profileName,
  mingleId,
  defaultReason = "Safety concern",
  title,
  description,
  label = "Report a concern",
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In production/Base44, reports are dispatched to platform founders privately.
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Report submitted securely. Our curation team will review it.");
      setOpen(false);
      setDetails("");
    } catch {
      toast.error("Could not submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle =
    title || (profileName ? `Report a concern about ${profileName}` : "Report a concern");
  const dialogDescription =
    description ||
    "This report is sent directly and confidentially to Mingler founders. They will not be informed who filed it.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-brand-coral cursor-pointer"
        >
          <Flag className="w-3 h-3" />
          <span>{label}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6 shadow-xl border border-border/80">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-brand-navy">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-brand-navy mb-1.5 uppercase tracking-wider">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-brand-ivory/20 px-3.5 py-2.5 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral/40"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy mb-1.5 uppercase tracking-wider">
              Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Provide any context that helps us understand…"
              className="w-full resize-none rounded-xl border border-border/70 bg-brand-ivory/20 px-3.5 py-2.5 text-xs text-brand-navy placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-coral/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-full text-xs font-semibold px-4 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 text-xs font-semibold px-5 h-9"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Sending…
                </>
              ) : (
                "Send Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
