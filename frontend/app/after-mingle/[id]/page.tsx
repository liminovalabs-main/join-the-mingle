"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Cake, Check, Clock, Heart, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MingleReviewStep } from "@/components/interactions/mingle-review-step";
import { MingleAgainChoices } from "@/components/interactions/mingle-again-choices";
import { ConnectionCelebration } from "@/components/interactions/connection-celebration";
import { useAuth } from "@/hooks/use-auth";
import { getMingle, getMingleAttendees } from "@/lib/api/mingles";
import {
  submitMingleFeedback,
  submitVenueReview,
  submitMingleSelections,
  getMyConnections,
} from "@/lib/api/interactions";
import { getMingleImageUrl } from "@/lib/constants/images";
import { formatDate } from "@/lib/utils/format";
import { extractErrorMessage } from "@/lib/api/client";
import { Mingle, PublicProfile } from "@/types";

function AfterMingleContent() {
  const params = useParams();
  const mingleId = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();

  const [mingle, setMingle] = useState<Mingle | null>(null);
  const [attendees, setAttendees] = useState<PublicProfile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [venueRating, setVenueRating] = useState(0);
  const [venueComment, setVenueComment] = useState("");
  const [experienceRating, setExperienceRating] = useState(0);
  const [experienceComment, setExperienceComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [celebration, setCelebration] = useState<PublicProfile[]>([]);
  const [connectedPeople, setConnectedPeople] = useState<PublicProfile[]>([]);

  useEffect(() => {
    if (!mingleId) return;
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        const [mingleData, attendeesData] = await Promise.all([
          getMingle(mingleId),
          getMingleAttendees(mingleId),
        ]);

        if (!active) return;
        setMingle(mingleData);

        // Filter out the current user from fellow attendees
        const myProfileId = profile?.id;
        const roster = attendeesData.attendees || [];
        const otherAttendees = roster.filter(
          (p: PublicProfile) => !myProfileId || p.id !== myProfileId
        );
        setAttendees(otherAttendees);
      } catch (err) {
        if (!active) return;
        const msg = extractErrorMessage(err);
        toast.error(msg || "Could not load experience details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }

    return () => {
      active = false;
    };
  }, [mingleId, profile?.id, authLoading]);

  const handleToggleProfile = (targetId: string, selected: boolean) => {
    setSelectedProfileIds((prev) =>
      selected ? [...prev, targetId] : prev.filter((id) => id !== targetId)
    );
  };

  const ready = venueRating > 0 && experienceRating > 0;

  const handleSubmitAll = async () => {
    if (!ready || !mingle || !mingleId) return;
    setSubmitting(true);

    try {
      // 1. Submit Mingle Experience Feedback
      await submitMingleFeedback(mingleId, {
        overall_rating: experienceRating,
        comment: experienceComment,
      }).catch((err) => {
        // If already submitted, proceed
        console.warn("Feedback submission notice:", err);
      });

      // 2. Submit 3NF Venue Review
      const venueSlugOrId = mingle.venue?.slug || mingle.venue?.id;
      if (venueSlugOrId) {
        await submitVenueReview(venueSlugOrId, {
          rating: venueRating,
          comment: venueComment,
        }).catch((err) => {
          console.warn("Venue review notice:", err);
        });
      }

      // 3. Submit Double-Blind Selections
      let newlyMatched = 0;
      if (selectedProfileIds.length > 0) {
        const selectionRes = await submitMingleSelections(mingleId, selectedProfileIds);
        newlyMatched = selectionRes.new_mutual_connections;
      }

      // 4. Fetch updated connections to evaluate matches
      const connections = await getMyConnections();
      const currentMingleConnections = connections.filter(
        (c) => c.mingle_id === mingleId
      );
      const matched = currentMingleConnections
        .map((c) => c.matched_profile)
        .filter(Boolean) as PublicProfile[];

      setConnectedPeople(matched);

      // Trigger instant celebration if new mutual pair was established
      if (newlyMatched > 0 && matched.length > 0) {
        setCelebration(matched);
      }

      setSubmitted(true);
      toast.success("Thank you! Your feedback and selections have been recorded.");
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg || "Could not submit your responses. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-5">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Loading experience…
          </p>
        </div>
      </div>
    );
  }

  if (!mingle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          <h2 className="font-heading text-xl font-bold text-brand-navy mb-2">
            Experience Not Found
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            We couldn't locate this mingle experience.
          </p>
          <Link href="/my-mingler">
            <Button className="rounded-full bg-brand-coral text-white font-bold text-xs px-5">
              Back to My Mingler
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = getMingleImageUrl(
    mingle.experience_type,
    mingle.hero_image || undefined
  );

  return (
    <div className="min-h-screen bg-brand-ivory/30 py-10 px-5">
      <div className="mx-auto max-w-2xl text-left">
        {/* Back Link */}
        <Link
          href="/my-mingler?tab=mingles"
          className="mb-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-brand-coral transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Mingler
        </Link>

        {/* Experience Header Card */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-border/70 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6">
            <div className="relative h-28 w-28 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-xs">
              <Image
                src={heroImage}
                alt={mingle.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, 96px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="mb-2 inline-block rounded-full bg-brand-coral/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-coral">
                {mingle.experience_type_display || mingle.experience_type}
              </span>
              <h1 className="font-heading text-xl sm:text-2xl font-black text-brand-navy leading-tight">
                {mingle.title}
              </h1>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                {mingle.venue && (
                  <span className="inline-flex items-center gap-1 text-brand-navy">
                    <MapPin className="h-3.5 w-3.5 text-brand-coral shrink-0" />
                    {mingle.venue.name}, {mingle.venue.area}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-brand-navy shrink-0" />
                  {formatDate(mingle.event_date)}
                </span>
                {mingle.start_time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-navy shrink-0" />
                    {mingle.start_time.slice(0, 5)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Cake className="h-3.5 w-3.5 text-brand-navy shrink-0" />
                  Ages {mingle.age_min}–{mingle.age_max}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Review Step + Attendee Choices OR Post-Submission View */}
        {submitted ? (
          <div className="animate-in fade-in duration-300">
            <div className="rounded-3xl border border-border/70 bg-white p-7 sm:p-8 shadow-xs text-left mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-brand-coral" />
                <h2 className="font-heading text-2xl font-black text-brand-navy">
                  Thank you!
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your review and selections have been saved. Here is who would like to mingle with you again too!
              </p>
            </div>

            {connectedPeople.length > 0 ? (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
                  You both want to mingle again!
                </h3>
                <div className="space-y-3">
                  {connectedPeople.map((person) => {
                    const firstName = person.display_name?.split(" ")[0] || "Mingler";
                    const initials = firstName[0] || "M";

                    return (
                      <Link
                        key={person.id}
                        href="/my-mingler?tab=connections"
                        className="flex items-center justify-between gap-4 rounded-3xl border border-brand-coral/40 bg-brand-coral/5 p-4 sm:p-5 transition-all hover:border-brand-coral hover:shadow-xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <Avatar className="h-12 w-12 rounded-full border border-brand-coral/30">
                            <AvatarImage
                              src={person.photo || undefined}
                              alt={person.display_name}
                              className="aspect-square object-cover"
                            />
                            <AvatarFallback className="bg-brand-coral/20 font-bold text-xs text-brand-coral">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-heading text-sm font-bold text-brand-navy truncate">
                              {firstName}
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-brand-coral mt-0.5">
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>You both want to mingle again</span>
                            </div>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-bold text-brand-coral hover:underline">
                          View connection &rarr;
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border/70 bg-white p-8 text-center shadow-xs mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-stone/20 text-brand-navy">
                  <Check className="h-7 w-7 text-brand-navy" />
                </div>
                <h3 className="mb-1.5 font-heading text-lg font-bold text-brand-navy">
                  Nothing mutual yet
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your choices stay strictly private. We will notify you the moment one becomes mutual!
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setSubmitted(false)}
                className="rounded-full text-xs font-bold px-6 h-11 border-border/80 text-brand-navy hover:text-brand-coral"
              >
                Edit my answers
              </Button>
              <Link href="/my-mingler?tab=connections">
                <Button className="rounded-full bg-brand-coral text-white font-bold hover:bg-brand-coral/90 text-xs px-6 h-11">
                  Back to My Mingler
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 space-y-8">
            <MingleReviewStep
              venueRating={venueRating}
              venueComment={venueComment}
              experienceRating={experienceRating}
              experienceComment={experienceComment}
              onChange={(next) => {
                if (next.venueRating !== undefined) setVenueRating(next.venueRating);
                if (next.venueComment !== undefined) setVenueComment(next.venueComment);
                if (next.experienceRating !== undefined)
                  setExperienceRating(next.experienceRating);
                if (next.experienceComment !== undefined)
                  setExperienceComment(next.experienceComment);
              }}
            />

            <MingleAgainChoices
              attendees={attendees}
              selectedProfileIds={selectedProfileIds}
              onToggleProfile={handleToggleProfile}
              mingleId={mingleId}
            />

            <div className="pt-6 border-t border-border/60">
              <Button
                onClick={handleSubmitAll}
                disabled={!ready || submitting}
                className="w-full rounded-full bg-brand-coral text-white font-bold px-8 py-6 text-sm sm:text-base hover:bg-brand-coral/90 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving…" : "Submit & see who wants to mingle again"}
              </Button>
              {!ready && (
                <p className="mt-2.5 text-xs text-muted-foreground text-center">
                  Rate both the venue and the experience to submit.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mutual Connection Celebration Overlay */}
        {celebration.length > 0 && (
          <ConnectionCelebration
            matchedProfiles={celebration}
            soundEnabled={profile?.sound_enabled !== false}
            onDismiss={() => setCelebration([])}
          />
        )}
      </div>
    </div>
  );
}

export default function AfterMinglePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-5">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Loading experience…
            </p>
          </div>
        </div>
      }
    >
      <AfterMingleContent />
    </Suspense>
  );
}
