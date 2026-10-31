import * as React from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface VenueStatusBannerProps {
  status: "pending" | "approved" | "rejected";
  venueName: string;
}

export function VenueStatusBanner({ status, venueName }: VenueStatusBannerProps) {
  if (status === "approved") {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 sm:p-5 flex items-start sm:items-center gap-3.5 text-emerald-950 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Verified Partner
            </span>
            <span className="font-bold text-sm text-emerald-950">{venueName} is Live</span>
          </div>
          <p className="text-xs text-emerald-800/90 leading-relaxed">
            Your venue is approved and listed in the London directory. Your published experiences are available for member bookings.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200/80 p-4 sm:p-5 flex items-start sm:items-center gap-3.5 text-rose-950 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
              Application Declined
            </span>
            <span className="font-bold text-sm text-rose-950">{venueName}</span>
          </div>
          <p className="text-xs text-rose-800/90 leading-relaxed">
            This venue application was not approved by our curation team. For questions or to submit updated licensing or venue info, please contact{" "}
            <span className="font-semibold underline">partners@mingler.co.uk</span>.
          </p>
        </div>
      </div>
    );
  }

  // Pending
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 sm:p-5 flex items-start sm:items-center gap-3.5 text-amber-950 shadow-xs">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
        <Clock className="w-5 h-5" />
      </div>
      <div className="space-y-0.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
            Under Curator Review
          </span>
          <span className="font-bold text-sm text-amber-950">{venueName} is Pending</span>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed">
          Your venue application has been received and is awaiting founder review. You can configure opening hours and draft experience proposals in the meantime.
        </p>
      </div>
    </div>
  );
}
