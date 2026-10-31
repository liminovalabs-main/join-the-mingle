"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function VenueIndexRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && (user?.role === "venue_manager" || user?.role === "admin")) {
      router.replace("/venue/dashboard");
    } else {
      router.replace("/venue/register");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <main className="min-h-screen bg-brand-ivory flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-coral" />
        <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
          Directing to Venue Portal...
        </p>
      </div>
    </main>
  );
}
