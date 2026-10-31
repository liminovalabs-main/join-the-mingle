"use client";

import * as React from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { Mingle } from "@/types/mingle";
import { formatDate, formatTime } from "@/lib/utils/format";
import { resolveCategoryHeroImage } from "@/lib/constants/images";
import { Badge } from "@/components/ui/badge";

interface VenueMinglesListProps {
  mingles: Mingle[];
  onProposeClick?: () => void;
}

function getStatusBadge(status: Mingle["status"]) {
  switch (status) {
    case "published":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
          Published Live
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          Approved
        </span>
      );
    case "changes_requested":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          Changes Requested
        </span>
      );
    case "submitted":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          Submitted for Review
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
          Cancelled
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
  }
}

export function VenueMinglesList({
  mingles,
  onProposeClick,
}: VenueMinglesListProps) {
  if (mingles.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 border border-brand-navy/10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-serif text-brand-navy">
          No Mingles Hosted Yet
        </h3>
        <p className="text-xs text-brand-navy/60 max-w-md mx-auto leading-relaxed">
          Propose your first experience proposal—whether a Sunday roast, mixology workshop, or wine tasting—and invite Londoners to gather.
        </p>
        {onProposeClick && (
          <button
            type="button"
            onClick={onProposeClick}
            className="rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold uppercase tracking-wider text-xs px-6 py-3.5 shadow-md transition-all active:scale-95"
          >
            Propose An Experience
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mingles.map((mingle) => {
        const heroImg = resolveCategoryHeroImage(
          mingle.experience_type,
          mingle.hero_image
        );

        return (
          <div
            key={mingle.id}
            className="rounded-3xl bg-white border border-brand-navy/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-44 sm:h-auto sm:w-56 shrink-0 bg-brand-navy/5">
                <Image
                  src={heroImg}
                  alt={mingle.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-brand-navy/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {mingle.experience_type_display || mingle.experience_type}
                  </Badge>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-bold font-serif text-brand-navy">
                    {mingle.title}
                  </h4>
                  <div>{getStatusBadge(mingle.status)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-navy/70">
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
                    £{parseFloat(mingle.ticket_price || "0").toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-brand-coral" />
                    {mingle.capacity} Capacity ({mingle.spots_remaining} remaining)
                  </span>
                </div>

                {mingle.description && (
                  <p className="text-xs text-brand-navy/60 line-clamp-2 leading-relaxed">
                    {mingle.description}
                  </p>
                )}

                {/* Curator Notes Banner when feedback exists */}
                {mingle.curator_notes && (
                  <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Curator Feedback from Mingler</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed pl-5">
                      &ldquo;{mingle.curator_notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
