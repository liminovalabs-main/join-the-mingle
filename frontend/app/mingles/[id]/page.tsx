"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hourglass,
  MapPin,
  Share2,
  Sparkles,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AttendeesSection } from "@/components/mingles/attendees-section";
import { MingleVenueSection } from "@/components/mingles/mingle-venue-section";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getMingle, getMingleAttendees } from "@/lib/api/mingles";
import { PublicProfile } from "@/types/auth";
import { Mingle } from "@/types/mingle";

function formatDateFull(d: string): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(minutes: number): string {
  if (!minutes) return "2 hours";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

function MingleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user, openModal } = useAuth();
  const isVisitor = !user;

  const mingleId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [mingle, setMingle] = useState<Mingle | null>(null);
  const [attendees, setAttendees] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mingleId) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      getMingle(mingleId).catch(() => null),
      getMingleAttendees(mingleId).catch(() => null),
    ])
      .then(([mingleData, attendeesData]) => {
        if (!isMounted) return;
        setMingle(mingleData);
        if (attendeesData?.attendees) {
          setAttendees(attendeesData.attendees);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mingleId, user]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${mingle?.title || "Mingle"} — Mingler`,
          text: `Join this social experience on Mingler: ${mingle?.title}`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleJoinClick = () => {
    if (isVisitor) {
      openModal("login");
      return;
    }
    router.push(`/checkout/${mingleId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">Loading experience details...</p>
      </div>
    );
  }

  if (!mingle) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-brand-navy">Mingle Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This experience may have been unlisted or removed.
        </p>
        <Link href="/browse" className="mt-6 inline-block">
          <Button variant="coral" className="rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  // Base44 Defect #3 Fix: Past Date Lockout Guard
  const isPast = new Date(mingle.event_date) < new Date(new Date().setHours(0, 0, 0, 0));
  const remaining = mingle.spots_remaining !== undefined ? mingle.spots_remaining : Math.max(0, mingle.capacity - attendees.length);
  const isSoldOut = mingle.is_sold_out || remaining <= 0;
  const heroImage = mingle.hero_image || FALLBACK_HERO_IMAGE;
  const priceDisplay = parseFloat(mingle.ticket_price).toFixed(0);

  const facts = [
    {
      icon: MapPin,
      label: "Venue",
      value: `${mingle.venue?.name || "London"}, ${mingle.venue?.area || "Central"}`,
    },
    {
      icon: Calendar,
      label: "Date",
      value: formatDateFull(mingle.event_date),
    },
    {
      icon: Clock,
      label: "Start Time",
      value: mingle.start_time?.slice(0, 5) || "19:00",
    },
    {
      icon: Hourglass,
      label: "Duration",
      value: formatDuration(mingle.duration_minutes),
    },
    {
      icon: Users,
      label: "Group Size",
      value: `${mingle.capacity} places (${remaining} remaining)`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:py-12 text-left">
      {/* Back Button */}
      <Link
        href="/browse"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-coral transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mingles
      </Link>

      {/* Hero Cover */}
      <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-brand-stone/20 shadow-xs">
        <Image
          src={heroImage}
          alt={mingle.title}
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className="h-full w-full object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Header Info */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[280px]">
          <span className="mb-3 inline-block rounded-full bg-brand-coral/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-coral">
            {mingle.experience_type_display || mingle.experience_type}
          </span>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-brand-navy md:text-5xl">
            {mingle.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-full border-border/80 px-4 text-xs font-bold uppercase tracking-wider text-brand-navy hover:text-brand-coral"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
          </Button>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-brand-coral">£{priceDisplay}</div>
            <div className="text-xs text-muted-foreground font-medium">per person</div>
          </div>
        </div>
      </div>

      {/* Defect #3 Fix: Past Event Warning Banner */}
      {isPast && (
        <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold">Registration Closed</p>
            <p className="text-xs text-amber-800">
              This experience took place in the past on {formatDateFull(mingle.event_date)}.
            </p>
          </div>
        </div>
      )}

      {/* Fact Grid */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/60 bg-white p-4 shadow-xs"
          >
            <fact.icon className="mb-2 h-4 w-4 text-brand-coral" />
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {fact.label}
            </div>
            <div className="mt-1 text-xs font-semibold text-brand-navy line-clamp-2">
              {fact.value}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="prose mb-10 max-w-none">
        <h2 className="mb-3 font-heading text-2xl font-bold text-brand-navy">
          About this experience
        </h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {mingle.description}
        </p>
      </div>

      {/* Venue Section */}
      <MingleVenueSection venueSummary={mingle.venue} />

      {/* Dynamic Attendee Roster (Base44 Defect #5 Fix) */}
      <AttendeesSection
        count={attendees.length || mingle.confirmed_attendees_count || 0}
        attendees={attendees}
        isVisitor={isVisitor}
        onPromptAuth={() => openModal("login")}
      />

      {/* Sticky Bottom Booking Action Bar */}
      <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-5 pt-4 z-30">
        <div className="rounded-3xl border border-border/70 bg-white p-4 md:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            {isPast ? (
              <span className="text-sm font-semibold text-muted-foreground">
                This event has already taken place
              </span>
            ) : isSoldOut ? (
              <span className="text-sm font-bold text-brand-navy">
                This mingle is fully booked
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Come alone or bring friends &mdash;{" "}
                <span className="font-bold text-brand-navy">
                  {remaining} {remaining === 1 ? "spot" : "spots"} left
                </span>
              </span>
            )}
          </div>

          <Button
            variant="coral"
            disabled={isPast || isSoldOut}
            onClick={handleJoinClick}
            className="w-full sm:w-auto h-12 rounded-full px-8 text-sm font-bold uppercase tracking-wider shadow-lg shadow-brand-coral/20"
          >
            {isPast ? (
              "Event Ended"
            ) : isSoldOut ? (
              "Sold Out"
            ) : (
              <>
                Join this Mingle <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MingleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading experience details...
          </p>
        </div>
      }
    >
      <MingleDetailContent />
    </Suspense>
  );
}

