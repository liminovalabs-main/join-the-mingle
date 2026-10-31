"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Venue } from "@/types/venue";
import { Mingle } from "@/types/mingle";
import { getMyVenues, getVenue, getVenueMingles } from "@/lib/api/venues";
import { extractErrorMessage } from "@/lib/api/client";
import { VenueStatusBanner } from "@/components/venue/venue-status-banner";
import { VenueMinglesList } from "@/components/venue/venue-mingles-list";
import { VenueOperatingHoursEditor } from "@/components/venue/venue-operating-hours-editor";
import { MingleProposalForm } from "@/components/venue/mingle-proposal-form";
import { Button } from "@/components/ui/button";

type DashboardTab = "mingles" | "profile" | "add";

export default function VenueDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, openModal } = useAuth();

  const [venues, setVenues] = React.useState<Venue[]>([]);
  const [activeVenueId, setActiveVenueId] = React.useState<string | null>(null);
  const [activeVenue, setActiveVenue] = React.useState<Venue | null>(null);
  const [venueMingles, setVenueMingles] = React.useState<Mingle[]>([]);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("mingles");
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Load managed venues
  const fetchVenues = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getMyVenues();
      const list = res.results || [];
      setVenues(list);
      if (list.length > 0) {
        const firstVenue = list[0];
        setActiveVenueId(firstVenue.id);
      }
    } catch (err: unknown) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load active venue full details and mingles
  const fetchVenueDetails = React.useCallback(async (venueId: string) => {
    try {
      const [fullVenue, minglesRes] = await Promise.all([
        getVenue(venueId),
        getVenueMingles(venueId),
      ]);
      setActiveVenue(fullVenue);
      setVenueMingles(minglesRes.results || []);
    } catch (err: unknown) {
      console.error("Failed to load venue details:", err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchVenues();
    }
  }, [isAuthenticated, fetchVenues]);

  React.useEffect(() => {
    if (activeVenueId) {
      fetchVenueDetails(activeVenueId);
    }
  }, [activeVenueId, fetchVenueDetails]);

  if (authLoading || (isAuthenticated && loading)) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-coral" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Loading Venue Hub...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-brand-ivory py-16 px-4">
        <div className="max-w-md mx-auto rounded-3xl bg-white p-8 border border-brand-navy/10 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-serif text-brand-navy">Venue Partner Hub</h1>
            <p className="text-xs text-brand-navy/70 leading-relaxed">
              Please sign in to access your venue dashboard, manage operating hours, and submit experience proposals.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => openModal("login")}
            className="w-full rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 font-bold uppercase tracking-wider text-xs py-5"
          >
            Sign In to Venue Hub
          </Button>
        </div>
      </main>
    );
  }

  if (venues.length === 0) {
    return (
      <main className="min-h-screen bg-brand-ivory py-16 px-4">
        <div className="max-w-xl mx-auto rounded-3xl bg-white p-8 sm:p-10 border border-brand-navy/10 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy/5 text-brand-navy flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-serif text-brand-navy">No Managed Venues Found</h1>
            <p className="text-xs text-brand-navy/70 leading-relaxed">
              Your account is not currently linked to an active London venue. If you represent a hospitality venue, apply now to become a partner.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/venue/register")}
            className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 font-bold uppercase tracking-wider text-xs px-8 py-5 shadow-lg shadow-brand-coral/25"
          >
            Apply to Partner
          </Button>
        </div>
      </main>
    );
  }

  const currentVenue = activeVenue || venues.find((v) => v.id === activeVenueId) || venues[0];

  return (
    <main className="min-h-screen bg-brand-ivory py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral">
                <ShieldCheck className="w-3.5 h-3.5" />
                Venue Partner Portal
              </div>
              <h1 className="text-3xl font-extrabold font-serif text-brand-navy tracking-tight">
                {currentVenue.name}
              </h1>
              <p className="text-xs text-brand-navy/60">
                {currentVenue.address}, {currentVenue.postcode} • {currentVenue.area} ({currentVenue.category})
              </p>
            </div>

            {/* Venue Selector (if managing multiple) or Public Link */}
            <div className="flex items-center gap-3">
              {venues.length > 1 && (
                <select
                  value={activeVenueId || ""}
                  onChange={(e) => setActiveVenueId(e.target.value)}
                  className="rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.area})
                    </option>
                  ))}
                </select>
              )}
              {currentVenue.status === "approved" && currentVenue.slug && (
                <Link
                  href={`/venues/${currentVenue.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-navy/80 hover:text-brand-coral transition-colors px-3 py-2 rounded-full border border-brand-navy/15 hover:border-brand-coral/40"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Status Banner */}
          <VenueStatusBanner
            status={currentVenue.status}
            venueName={currentVenue.name}
          />

          {/* Horizontal Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-brand-navy/10 pt-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("mingles")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "mingles"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Experiences ({venueMingles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Operating Hours & Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "add"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Propose Experience</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "mingles" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif text-brand-navy">
                Hosted Experiences
              </h2>
              <Button
                type="button"
                onClick={() => setActiveTab("add")}
                className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 font-bold uppercase tracking-wider text-xs px-5 py-2.5 shadow-md active:scale-95 transition-all"
              >
                + Propose Experience
              </Button>
            </div>
            <VenueMinglesList
              mingles={venueMingles}
              onProposeClick={() => setActiveTab("add")}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-8">
            <VenueOperatingHoursEditor
              venueId={currentVenue.id}
              initialHours={currentVenue.opening_hours}
              onUpdated={(updatedHours) => {
                setActiveVenue((prev) =>
                  prev ? { ...prev, opening_hours: updatedHours } : prev
                );
              }}
            />
          </div>
        )}

        {activeTab === "add" && (
          <div className="space-y-6">
            <MingleProposalForm
              venueId={currentVenue.id}
              venueName={currentVenue.name}
              onSuccess={(newMingle) => {
                setVenueMingles((prev) => [newMingle, ...prev]);
                setActiveTab("mingles");
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
