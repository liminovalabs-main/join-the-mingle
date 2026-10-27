"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { MemberBookingsTab } from "@/components/bookings/member-bookings-tab";
import { Button } from "@/components/ui/button";
import { User, Calendar, Heart, Lock } from "lucide-react";

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
          <h1 className="font-heading text-3xl md:text-4xl font-black text-brand-navy tracking-tight">
            My Mingler
          </h1>

          {/* Defect #2 Fix: onEdit is only passed if user is NOT on the profile tab */}
          <ProfileSummaryCard
            profile={profile}
            onEdit={activeTab !== "profile" ? () => setActiveTab("profile") : undefined}
          />
        </div>

        {/* Base44 Horizontal Pill Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white border border-border/70 text-brand-navy/70 hover:bg-white hover:text-brand-navy"
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mingles")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "mingles"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white border border-border/70 text-brand-navy/70 hover:bg-white hover:text-brand-navy"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mingles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("connections")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "connections"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white border border-border/70 text-brand-navy/70 hover:bg-white hover:text-brand-navy"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Connections</span>
          </button>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === "profile" && <ProfileEditor />}

          {activeTab === "mingles" && <MemberBookingsTab />}

          {activeTab === "connections" && (
            <div className="p-10 rounded-3xl bg-white border border-border/70 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-coral/15 flex items-center justify-center text-brand-coral">
                <Heart className="w-8 h-8 fill-brand-coral/20" />
              </div>
              <h3 className="text-xl font-heading font-black text-brand-navy">
                Mutual Connections
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                After you attend a Mingle experience, you will select attendees you enjoyed speaking with. When they pick you back, they will appear here with Instagram and LinkedIn links!
              </p>
            </div>
          )}
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
