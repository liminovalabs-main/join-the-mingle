"use client";

import { Lock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PublicProfile } from "@/types/auth";

interface AttendeesSectionProps {
  count: number;
  attendees: PublicProfile[];
  isVisitor: boolean;
  onPromptAuth?: () => void;
}

export function AttendeesSection({
  count,
  attendees,
  isVisitor,
  onPromptAuth,
}: AttendeesSectionProps) {
  const { openModal } = useAuth();
  const peopleText = count === 1 ? "person" : "people";

  const handleAuthClick = () => {
    if (onPromptAuth) {
      onPromptAuth();
    } else {
      openModal("login");
    }
  };

  return (
    <div className="mb-10 text-left">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="font-heading text-2xl font-bold text-brand-navy">Who&apos;s going</h2>
        {count > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-stone/40 text-brand-navy">
            {count} confirmed
          </span>
        )}
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        {count === 0
          ? "No one has joined yet. Take the first spot!"
          : isVisitor
          ? `${count} ${peopleText} already attending.`
          : `${count} ${peopleText} attending &mdash; see who is coming to this mingle.`}
      </p>

      {/* Visitor Account Prompt Banner */}
      {isVisitor && count > 0 && (
        <div className="mb-6 rounded-2xl border border-brand-coral/20 bg-brand-coral/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">
                Want to see who is going?
              </p>
              <p className="text-xs text-muted-foreground">
                Attendee profiles are private to registered Minglers for community privacy.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="coral"
            onClick={handleAuthClick}
            className="rounded-full shrink-0 font-semibold"
          >
            Sign in to view
          </Button>
        </div>
      )}

      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-brand-ivory/40 p-8 text-center text-sm text-brand-navy/70">
          Be the first to join this experience and invite friends along!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {isVisitor
            ? Array.from({ length: Math.min(count, 8) }).map((_, index) => (
                <div
                  key={`blurred-${index}`}
                  onClick={handleAuthClick}
                  className="cursor-pointer flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-all hover:border-brand-coral/40 hover:bg-brand-coral/5"
                >
                  <div
                    className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-stone to-brand-navy/30 ring-2 ring-white"
                    style={{ width: 44, height: 44 }}
                  >
                    <User className="h-5 w-5 text-brand-ivory/80 blur-[2px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="h-3.5 w-20 rounded bg-muted animate-pulse mb-1.5" />
                    <div className="h-2.5 w-14 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))
            : attendees.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3 shadow-xs hover:border-brand-coral/40 transition-colors"
                >
                  <Avatar className="w-11 h-11 border border-border">
                    <AvatarImage src={profile.photo} alt={profile.display_name} />
                    <AvatarFallback className="bg-brand-coral/10 text-brand-coral font-bold text-sm">
                      {profile.display_name?.slice(0, 2).toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-brand-navy">
                      {profile.display_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {profile.gender || "Mingler"}
                      {profile.interests && profile.interests.length > 0 && (
                        <span> · {profile.interests[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
export default AttendeesSection;
