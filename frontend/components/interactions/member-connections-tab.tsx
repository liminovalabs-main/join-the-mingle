"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, ExternalLink, Calendar, MapPin, Sparkles } from "lucide-react";
import { OverlappingCirclesMark } from "@/components/brand/mingler-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Connection, getMyConnections } from "@/lib/api/interactions";
import { calcAgeGroupFromDob, calcAgeGroup } from "@/lib/utils/age";
import { formatDate } from "@/lib/utils/format";

export function MemberConnectionsTab() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyConnections();
      setConnections(data);
    } catch {
      // Graceful fallback to empty state
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Loading your connections…
        </p>
      </div>
    );
  }

  return (
    <section className="text-left space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <OverlappingCirclesMark className="h-5 w-auto shrink-0" />
          <h2 className="font-heading text-xl sm:text-2xl font-black text-brand-navy">
            People I'd Mingle With Again ({connections.length})
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You both said you'd mingle again! View their profiles and reach out to stay in touch.
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-3xl bg-white border border-border/70 p-10 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-coral/15 flex items-center justify-center text-brand-coral mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-lg font-bold text-brand-navy mb-1.5">
            No connections yet
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            After attending a Mingle, select the people you'd like to see again. If they pick you too, they will appear here with direct profile and social links.
          </p>
          <div className="mt-6">
            <Link href="/browse">
              <Button className="rounded-full bg-brand-coral text-white font-bold hover:bg-brand-coral/90 text-xs px-6 h-10">
                Browse Upcoming Mingles
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => {
            const profile = conn.matched_profile;
            if (!profile) return null;

            const initials = profile.display_name
              ? profile.display_name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "M";

            const demographicAge =
              (profile as unknown as { date_of_birth?: string }).date_of_birth
                ? calcAgeGroupFromDob((profile as unknown as { date_of_birth?: string }).date_of_birth)
                : (profile as unknown as { age?: number }).age
                ? calcAgeGroup((profile as unknown as { age?: number }).age)
                : null;

            const meta = [demographicAge, profile.gender].filter(Boolean).join(" · ");

            return (
              <div
                key={conn.id}
                className="rounded-3xl bg-white border border-border/70 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all hover:border-brand-coral/40"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Link href={`/people/${profile.id}`}>
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-brand-coral/30 shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0">
                      <AvatarImage
                        src={profile.photo || undefined}
                        alt={profile.display_name}
                        className="aspect-square object-cover"
                      />
                      <AvatarFallback className="bg-brand-stone/30 font-bold text-sm text-brand-navy">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/people/${profile.id}`}
                        className="font-heading text-base sm:text-lg font-bold text-brand-navy hover:text-brand-coral transition-colors truncate"
                      >
                        {profile.display_name}
                      </Link>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-brand-coral/15 text-brand-coral border-brand-coral/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 inline-flex items-center gap-1.5"
                      >
                        <OverlappingCirclesMark className="h-3 w-auto" />
                        <span>minglers connected !</span>
                      </Badge>
                    </div>

                    {meta && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {meta}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-xs text-brand-navy/70">
                      <Calendar className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                      <span className="truncate">
                        Met at: <strong className="text-brand-navy">{conn.mingle_title}</strong>
                        {conn.mingle_date && ` (${formatDate(conn.mingle_date)})`}
                      </span>
                    </div>

                    {/* Social handles if provided */}
                    <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                      {profile.instagram_handle && (
                        <a
                          href={`https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>@{profile.instagram_handle.replace(/^@/, "")}</span>
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Link href={`/people/${profile.id}`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto rounded-full border-border/80 text-brand-navy font-bold text-xs h-9 px-4 hover:border-brand-coral hover:text-brand-coral"
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
