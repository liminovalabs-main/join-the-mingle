"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, User, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMingleImageUrl, formatAvatarUrl } from "@/lib/constants/images";
import { Mingle } from "@/types/mingle";
import { PublicProfile } from "@/types/auth";

interface MingleCardProps {
  mingle: Mingle;
  attendees?: PublicProfile[];
  isVisitor?: boolean;
}

function formatCardDate(d: string): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatCardTime(t: string): string {
  if (!t) return "";
  const [hours, minutes] = t.split(":");
  return `${hours}:${minutes}`;
}

function ageLabel(mingle: Mingle): string {
  if (mingle.age_min && mingle.age_max && (mingle.age_min > 18 || mingle.age_max < 90)) {
    return `Ages ${mingle.age_min}\u2013${mingle.age_max}`;
  }
  if (mingle.age_min && mingle.age_min > 18) {
    return `Ages ${mingle.age_min}+`;
  }
  return "";
}

export function MingleCard({ mingle, attendees = [], isVisitor = false }: MingleCardProps) {
  const effectiveAttendees = attendees.length > 0 ? attendees : (mingle.preview_attendees || []);
  const confirmedCount = mingle.confirmed_attendees_count ?? effectiveAttendees.length;
  const remaining = mingle.spots_remaining !== undefined ? mingle.spots_remaining : Math.max(0, mingle.capacity - confirmedCount);
  const ageText = ageLabel(mingle);
  const attendeeCount = Math.max(confirmedCount, effectiveAttendees.length);
  const avatarSlots = isVisitor ? Math.min(attendeeCount, 4) : Math.min(effectiveAttendees.length, 4);
  const priceDisplay = parseFloat(mingle.ticket_price).toFixed(0);

  const imageUrl = getMingleImageUrl(mingle.hero_image, mingle.experience_type);

  // Check if date is in the past
  const isPast = new Date(mingle.event_date) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Link href={`/mingles/${mingle.id}`} className="group block text-left">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-stone/30 sm:aspect-[4/3]">
        <Image
          src={imageUrl}
          alt={mingle.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          priority={false}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 z-10">
          <span className="rounded-full bg-brand-navy/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-ivory backdrop-blur">
            {mingle.experience_type_display || mingle.experience_type}
          </span>
          <span className="rounded-full bg-brand-coral px-3 py-1.5 text-sm font-bold text-white shadow-sm">
            £{priceDisplay}
          </span>
        </div>

        {isPast && (
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white border border-white/30 backdrop-blur">
              Completed
            </span>
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="font-heading text-xl font-bold leading-tight tracking-tight text-brand-navy line-clamp-2 group-hover:text-brand-coral transition-colors">
          {mingle.title}
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
            <span className="truncate max-w-[140px] sm:max-w-[180px] md:max-w-none">
              {mingle.venue?.name || "London"}, {mingle.venue?.area || "Central"}
            </span>
          </span>
          <span className="text-brand-stone">•</span>
          <span className="shrink-0">
            {formatCardDate(mingle.event_date)} · {formatCardTime(mingle.start_time)}
          </span>
          {ageText && (
            <span className="rounded-full bg-brand-stone/60 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-brand-navy shrink-0">
              {ageText}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex -space-x-1.5 sm:-space-x-2 items-center shrink-0">
            {isVisitor
              ? Array.from({ length: Math.min(attendeeCount, 4) }).map((_, i) => (
                  <span
                    key={`blurred-${i}`}
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-stone to-brand-navy/30 ring-2 ring-white w-8 h-8 sm:w-9 sm:h-9"
                    aria-hidden="true"
                  >
                    <User className="h-4 w-4 text-brand-ivory/80 blur-[2px]" />
                  </span>
                ))
              : effectiveAttendees.slice(0, 4).map((p) => {
                  const avatarSrc = formatAvatarUrl(p.photo);
                  return (
                    <Avatar
                      key={p.id}
                      className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-white ring-2 ring-white shrink-0 shadow-xs"
                      title={p.display_name}
                    >
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={p.display_name} className="object-cover" />}
                      <AvatarFallback className="text-[10px] sm:text-xs bg-brand-coral/10 text-brand-coral font-bold">
                        {p.display_name?.slice(0, 2).toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
            {Array.from({ length: Math.max(0, Math.min(remaining, 4 - avatarSlots)) }).map((_, i) => (
              <span
                key={`empty-${i}`}
                className="shrink-0 rounded-full border border-dashed border-brand-stone bg-transparent ring-2 ring-white w-8 h-8 sm:w-9 sm:h-9"
                aria-hidden="true"
              />
            ))}
            {attendeeCount === 0 && remaining > 0 && (
              <span className="ml-1 self-center text-xs text-muted-foreground truncate">Be the first to join</span>
            )}
          </div>

          {isPast ? (
            <span className="shrink-0 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Past Event
            </span>
          ) : remaining > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-navy">
              <Users className="h-3.5 w-3.5 text-brand-coral" />
              {remaining} left
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-brand-navy px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ivory">
              Full
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
export default MingleCard;
