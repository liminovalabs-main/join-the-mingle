"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock, Calendar } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getPublicProfile, AttendingMingleSummary } from "@/lib/api/profiles";
import { PublicProfile } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function PersonProfileContent() {
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated, isLoading: authLoading, openModal } = useAuth();

  const [profile, setProfile] = React.useState<PublicProfile | null>(null);
  const [attendingMingles, setAttendingMingles] = React.useState<AttendingMingleSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (!id) return;

    let isMounted = true;
    setLoading(true);

    getPublicProfile(id)
      .then((res) => {
        if (!isMounted) return;
        setProfile(res.profile);
        setAttendingMingles(res.attending_mingles || []);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Could not load member profile", err);
        setError("Profile not found or no longer available.");
        setProfile(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-coral border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Loading member profile...
          </p>
        </div>
      </div>
    );
  }

  // UK GDPR Member Gate: Non-logged in visitors cannot see member profiles
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-coral/15 text-brand-coral">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-black text-brand-navy tracking-tight">
          Mingler Profiles are for Members
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Create an account or log in to see who is going to this mingle and open attendee profiles.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            variant="coral"
            onClick={() => openModal("login")}
            className="rounded-full px-7 font-bold shadow-sm"
          >
            Sign In to View
          </Button>
          <Button
            variant="outline"
            onClick={() => openModal("register")}
            className="rounded-full px-7 font-bold"
          >
            Join Mingler Free
          </Button>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-navy">Profile Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "We could not find the requested member profile."}
        </p>
        <Link href="/browse" className="mt-6 inline-block">
          <Button variant="coral" className="rounded-full px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Mingles
          </Button>
        </Link>
      </div>
    );
  }

  const formatName = (name?: string) => {
    if (!name) return "Member";
    const parts = name.trim().split(/\s+/);
    const prefixes = ["md.", "md", "dr.", "dr", "mr.", "mr", "ms.", "ms", "mrs.", "mrs", "prof.", "prof"];
    if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  const firstName = formatName(profile.display_name);
  const initials = firstName.slice(0, 2).toUpperCase();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory/40 pb-24">
      <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-coral transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mingles
        </Link>

        {/* Base44 Replicated Member Card */}
        <div className="rounded-3xl border border-border/70 bg-white p-8 text-center shadow-xs">
          <Avatar className="mx-auto mb-4 h-28 w-28 border-2 border-brand-coral/40 shadow-sm aspect-square">
            {profile.photo && (
              <AvatarImage
                src={profile.photo}
                alt={profile.display_name}
                className="object-cover w-full h-full"
              />
            )}
            <AvatarFallback className="text-3xl font-black bg-brand-coral/15 text-brand-coral">
              {initials}
            </AvatarFallback>
          </Avatar>

          <h1 className="font-heading text-3xl font-black text-brand-navy leading-none">
            {firstName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground font-medium">
            {profile.age_group && <span>{profile.age_group}</span>}
            {profile.gender && <span>&middot; {profile.gender}</span>}
            {profile.relationship_status && <span>&middot; {profile.relationship_status}</span>}
          </div>

          {profile.bio && (
            <p className="mt-5 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-1.5 pt-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1 rounded-full bg-brand-stone/40 text-xs font-semibold text-brand-navy"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Base44 Also Attending Section */}
        {attendingMingles.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 font-heading text-xl font-bold text-brand-navy flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-coral" />
              <span>Also attending</span>
            </h2>

            <div className="space-y-3">
              {attendingMingles.map((m) => (
                <Link
                  key={m.id}
                  href={`/mingles/${m.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white p-4 shadow-xs transition-all hover:border-brand-coral/40 hover:shadow-sm"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted relative">
                    {m.hero_image ? (
                      <img
                        src={m.hero_image}
                        alt={m.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-stone/30 flex items-center justify-center text-xs text-muted-foreground font-bold">
                        Mingle
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-heading font-bold text-brand-navy truncate">
                      {m.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {m.venue_name}
                      {m.venue_area ? ` (${m.venue_area})` : ""} &middot; {formatDate(m.event_date)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PersonProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-coral border-t-transparent animate-spin" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <PersonProfileContent />
    </React.Suspense>
  );
}
