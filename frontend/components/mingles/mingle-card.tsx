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
    return `Age ${mingle.age_min}–${mingle.age_max}`;
  }
  if (mingle.age_min && mingle.age_min > 18) {
    return `Age ${mingle.age_min}+`;
  }
  return "All Ages 18+";
}

export function MingleCard({ mingle, attendees = [], isVisitor = false }: MingleCardProps) {
  const effectiveAttendees = attendees.length > 0 ? attendees : (mingle.preview_attendees || []);
  const confirmedCount = mingle.confirmed_attendees_count ?? effectiveAttendees.length;
  const remaining = mingle.spots_remaining !== undefined ? mingle.spots_remaining : Math.max(0, mingle.capacity - confirmedCount);
  const ageText = ageLabel(mingle);
  const attendeeCount = Math.max(confirmedCount, effectiveAttendees.length);
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 z-10">
          <span className="rounded-full bg-brand-navy/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-ivory backdrop-blur">
            {mingle.experience_type_display || mingle.experience_type}
          </span>
          <span className="rounded-full bg-brand-coral px-3 py-1.5 text-sm font-bold text-white shadow-sm">
            £{priceDisplay}
          </span>
        </div>

        {/* Clear Age Group badge directly on cover image */}
        {ageText && (
          <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex items-end justify-between">
            <span className="rounded-full bg-brand-navy/90 border border-white/20 px-3.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
              {ageText}
            </span>
          </div>
        )}

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
        </div>

        {/* Attendees Section: Larger avatars (40px), not intertwined, showing all confirmed attendees */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-navy">
            <span className="uppercase tracking-wider text-muted-foreground text-[11px]">
              {confirmedCount > 0 ? `Attendees (${confirmedCount})` : "Be the first to join"}
            </span>
            {isPast ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Past Event
              </span>
            ) : remaining > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-navy">
                <Users className="h-3.5 w-3.5 text-brand-coral" />
                {remaining} left
              </span>
            ) : (
              <span className="rounded-full bg-brand-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ivory">
                Full
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isVisitor
              ? Array.from({ length: Math.max(attendeeCount, 1) }).map((_, i) => (
                  <span
                    key={`blurred-${i}`}
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-stone to-brand-navy/30 ring-2 ring-white w-10 h-10 shadow-xs"
                    aria-hidden="true"
                    title="Sign up to view attendee profiles"
                  >
                    <User className="h-5 w-5 text-brand-ivory/80 blur-[2px]" />
                  </span>
                ))
              : effectiveAttendees.map((p) => {
                  const avatarSrc = formatAvatarUrl(p.photo);
                  return (
                    <Avatar
                      key={p.id}
                      className="w-10 h-10 border-2 border-white ring-2 ring-brand-coral/20 shrink-0 shadow-xs"
                      title={p.display_name}
                    >
                      {avatarSrc && <AvatarImage src={avatarSrc} alt={p.display_name} className="object-cover" />}
                      <AvatarFallback className="text-xs bg-brand-coral/10 text-brand-coral font-bold">
                        {p.display_name?.slice(0, 2).toUpperCase() || "m"}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
            {attendeeCount === 0 && remaining > 0 && (
              <span className="text-xs text-muted-foreground italic py-1">
                Open table &mdash; reserve your seat!
              </span>
            )}
          </div>
        </div>

        {/* Clear Call-To-Action on home page & catalog for visitors */}
        {isVisitor && (
          <div className="mt-3.5 pt-2">
            <span className="inline-flex w-full items-center justify-center rounded-full bg-brand-coral/10 border border-brand-coral/40 px-3.5 py-2 text-xs font-bold text-brand-coral hover:bg-brand-coral hover:text-white transition-colors text-center shadow-2xs">
              Create an account to join this mingle!
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
export default MingleCard;
