"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";
import { OverlappingCirclesMark } from "@/components/brand/mingler-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicProfile } from "@/types";
import { playConnectionChime, prefersReducedMotion } from "@/lib/utils/chime";

const BURST_COLOURS = ["#FF5C60", "#16203A", "#5475A6", "#F5F1E8"];

interface ConnectionCelebrationProps {
  matchedProfiles: PublicProfile[];
  soundEnabled?: boolean;
  onDismiss: () => void;
}

export function ConnectionCelebration({
  matchedProfiles,
  soundEnabled = true,
  onDismiss,
}: ConnectionCelebrationProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // Respect reduced-motion preferences
    if (!prefersReducedMotion()) {
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 42,
        origin: { y: 0.35 },
        colors: BURST_COLOURS,
        disableForReducedMotion: true,
        zIndex: 60,
      });

      const secondTimeout = window.setTimeout(() => {
        confetti({
          particleCount: 55,
          spread: 110,
          origin: { y: 0.4 },
          colors: BURST_COLOURS,
          disableForReducedMotion: true,
          zIndex: 60,
        });
      }, 220);

      return () => window.clearTimeout(secondTimeout);
    }
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    playConnectionChime().catch(() => {});
  }, [soundEnabled]);

  const first = matchedProfiles[0];
  const firstName = first?.display_name?.split(" ")[0] || "someone";
  const headline =
    matchedProfiles.length > 1
      ? `You and ${matchedProfiles.length} Minglers would like to mingle again!`
      : `You and ${firstName} would like to mingle again!`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl border border-border/80"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 flex h-16 w-20 items-center justify-center rounded-full bg-brand-coral/15">
          <OverlappingCirclesMark className="h-8 w-auto" />
        </div>

        <h3 className="mb-2 font-heading text-2xl font-black text-brand-navy leading-tight lowercase">
          minglers connected <span className="text-brand-coral">!</span>
        </h3>
        <p className="mb-2 text-sm font-bold text-brand-coral">
          {matchedProfiles.length > 1
            ? `You and ${matchedProfiles.length} minglers would like to mingle again!`
            : `You and ${firstName} would like to mingle again!`}
        </p>
        <p className="mb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Your choices were mutual. You can now see when they join another mingle, and reach out to stay in touch!
        </p>

        <div className="mb-6 flex justify-center items-center gap-3">
          {matchedProfiles.slice(0, 4).map((person) => {
            const initials = person.display_name
              ? person.display_name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "M";

            return (
              <Avatar
                key={person.id}
                className="h-16 w-16 rounded-full ring-3 ring-brand-coral ring-offset-2 shadow-sm"
              >
                <AvatarImage
                  src={person.photo || undefined}
                  alt={person.display_name}
                  className="aspect-square object-cover"
                />
                <AvatarFallback className="bg-brand-stone/30 font-bold text-sm text-brand-navy">
                  {initials}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/my-mingler?tab=connections" onClick={onDismiss} className="w-full sm:w-auto">
            <Button className="w-full rounded-full bg-brand-coral text-white font-bold hover:bg-brand-coral/90 text-xs sm:text-sm px-6 h-11 inline-flex items-center gap-2">
              <OverlappingCirclesMark className="h-4 w-auto" />
              <span>View connections</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="rounded-full text-xs sm:text-sm font-semibold text-muted-foreground hover:text-brand-navy h-11"
          >
            Nice!
          </Button>
        </div>
      </div>
    </div>
  );
}
