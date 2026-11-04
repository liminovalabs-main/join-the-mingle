"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { MemberBookingsTab } from "@/components/bookings/member-bookings-tab";
import { MemberConnectionsTab } from "@/components/interactions/member-connections-tab";
import { Button } from "@/components/ui/button";
import { User, Calendar, Lock } from "lucide-react";
import { OverlappingCirclesMark } from "@/components/brand/mingler-logo";

function MyMinglerContent() {
  const { profile, isAuthenticated, isLoading, isMounted, openModal } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "profile" | "mingles" | "connections") || "profile";
  const [activeTab, setActiveTab] = React.useState<"profile" | "mingles" | "connections">(initialTab);

  React.useEffect(() => {
    const tabParam = searchParams.get("tab") as "profile" | "mingles" | "connections";
    if (tabParam && (tabParam === "profile" || tabParam === "mingles" || tabParam === "connections")) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-coral border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white border border-border shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-coral/15 flex items-center justify-center text-brand-coral">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-black tracking-tight text-brand-navy">
              Mingler Profiles are for Members
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to manage your profile, view upcoming mingles, and see your mutual connections.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="coral"
              onClick={() => openModal("login")}
              className="w-full h-12 text-sm font-bold uppercase tracking-wider rounded-xl shadow-md"
            >
              Sign In to Your Account
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal("register")}
              className="w-full h-12 text-sm font-bold uppercase tracking-wider rounded-xl"
            >
              Create a Free Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-ivory/40 pb-24">
      <div className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        {/* Top Header & Base44 Profile Summary Card */}
        <div className="mb-8 space-y-5">
          <h1 className="font-heading text-3xl md:text-4xl font-black text-brand-navy tracking-tight lowercase">
            my mingler<span className="text-brand-coral inline-block font-black rounded-full">.</span>
          </h1>

          {/* Defect #2 Fix: onEdit is only passed if user is NOT on the profile tab */}
          <ProfileSummaryCard
            profile={profile}
            onEdit={activeTab !== "profile" ? () => setActiveTab("profile") : undefined}
          />
        </div>

        {/* Coral and Blue Distinct Horizontal Pill Tabs */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-brand-coral text-white border-2 border-brand-coral shadow-md shadow-brand-coral/25"
                : "bg-white border-2 border-brand-navy/30 text-brand-navy hover:border-brand-navy hover:bg-brand-navy/5"
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mingles")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "mingles"
                ? "bg-brand-coral text-white border-2 border-brand-coral shadow-md shadow-brand-coral/25"
                : "bg-white border-2 border-brand-navy/30 text-brand-navy hover:border-brand-navy hover:bg-brand-navy/5"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mingles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("connections")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "connections"
                ? "bg-brand-coral text-white border-2 border-brand-coral shadow-md shadow-brand-coral/25"
                : "bg-white border-2 border-brand-navy/30 text-brand-navy hover:border-brand-navy hover:bg-brand-navy/5"
            }`}
          >
            <OverlappingCirclesMark className="w-5 h-3.5 shrink-0" />
            <span>Connected Minglers</span>
          </button>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === "profile" && <ProfileEditor />}

          {activeTab === "mingles" && <MemberBookingsTab />}

          {activeTab === "connections" && <MemberConnectionsTab />}
        </main>
      </div>
    </div>
  );
}

export default function MyMinglerPage() {
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
      <MyMinglerContent />
    </React.Suspense>
  );
}
