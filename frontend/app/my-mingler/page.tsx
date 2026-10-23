"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { Button } from "@/components/ui/button";
import { User, Calendar, Heart, Lock } from "lucide-react";

export default function MyMinglerPage() {
  const { isAuthenticated, isLoading, isMounted, openModal } = useAuth();
  const [activeTab, setActiveTab] = React.useState<"profile" | "mingles" | "connections">("profile");

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
              Members Only Area
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
      {/* Page Header */}
      <div className="bg-brand-navy text-brand-ivory py-10 px-5 border-b border-brand-ivory/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black tracking-tight text-brand-ivory">
              My Mingler
            </h1>
            <p className="text-xs text-brand-ivory/70 mt-1 uppercase tracking-wider font-medium">
              Manage your profile, bookings & mutual connections
            </p>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-brand-navy/80 border border-brand-ivory/15">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-brand-coral text-white shadow-sm"
                  : "text-brand-ivory/70 hover:text-brand-ivory"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mingles")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "mingles"
                  ? "bg-brand-coral text-white shadow-sm"
                  : "text-brand-ivory/70 hover:text-brand-ivory"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mingles</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("connections")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "connections"
                  ? "bg-brand-coral text-white shadow-sm"
                  : "text-brand-ivory/70 hover:text-brand-ivory"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Connections</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-5 pt-8">
        {/* Defect #2 Fix: No redundant "Edit Profile" button is rendered on the Profile tab! */}
        {activeTab === "profile" && <ProfileEditor />}

        {activeTab === "mingles" && (
          <div className="p-10 rounded-3xl bg-white border border-border text-center space-y-4">
            <Calendar className="w-12 h-12 text-brand-coral/60 mx-auto" />
            <h3 className="text-xl font-heading font-black text-brand-navy">
              Your Booked Mingles
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You do not have any upcoming bookings yet. Browse our curated London dining and cocktail experiences to reserve your seat!
            </p>
            <div className="pt-2">
              <Link href="/browse">
                <Button
                  variant="coral"
                  className="rounded-xl px-6"
                >
                  Explore Mingles
                </Button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "connections" && (
          <div className="p-10 rounded-3xl bg-white border border-border text-center space-y-4">
            <Heart className="w-12 h-12 text-brand-coral/60 mx-auto" />
            <h3 className="text-xl font-heading font-black text-brand-navy">
              Mutual Connections
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              After you attend a Mingle experience, you will select attendees you enjoyed speaking with. When they pick you back, they will appear here with contact links!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
