"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Inbox,
  Loader2,
  Percent,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";
import { MingleApprovalItem, VenueApprovalItem } from "@/types/admin";
import { getCommissionSettings, getPendingMingles, getPendingVenues } from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/client";
import { AdminGuard } from "@/components/admin/admin-guard";
import { VenueApprovalCard } from "@/components/admin/venue-approval-card";
import { MingleApprovalCard } from "@/components/admin/mingle-approval-card";
import { PlatformCommissionCard } from "@/components/admin/platform-commission-card";
import { Button } from "@/components/ui/button";

type AdminTab = "venues" | "mingles" | "settings";

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("venues");
  const [pendingVenues, setPendingVenues] = React.useState<VenueApprovalItem[]>([]);
  const [pendingMingles, setPendingMingles] = React.useState<MingleApprovalItem[]>([]);
  const [commissionRate, setCommissionRate] = React.useState<number>(10.0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMsg(null);

    try {
      const [venuesRes, minglesRes, commissionRes] = await Promise.all([
        getPendingVenues(),
        getPendingMingles(),
        getCommissionSettings(),
      ]);

      setPendingVenues(venuesRes.results || []);
      setPendingMingles(minglesRes.results || []);
      setCommissionRate(commissionRes.commission_rate);
    } catch (err: unknown) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVenueDecided = (id: string) => {
    setPendingVenues((prev) => prev.filter((v) => v.id !== id));
  };

  const handleMingleDecided = (
    id: string,
    action: "approve" | "changes_requested" | "reject"
  ) => {
    if (action === "approve" || action === "reject") {
      setPendingMingles((prev) => prev.filter((m) => m.id !== id));
    } else {
      // changes_requested remains in queue with updated badge
      loadData(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-coral" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Loading Founder Command Center...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-ivory py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Command Center Header */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral">
                <Shield className="w-3.5 h-3.5" />
                Founder Command Center
              </div>
              <h1 className="text-3xl font-extrabold font-serif text-brand-navy tracking-tight">
                Curation & Operations
              </h1>
              <p className="text-xs text-brand-navy/60">
                Review pending venue registrations, approve experience proposals, and control platform take-rates.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="rounded-full border-brand-navy/20 text-brand-navy font-bold uppercase tracking-wider text-xs px-5 py-2.5 shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Queue
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-2xl bg-brand-ivory/60 p-4 border border-brand-navy/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/60 block">
                  Pending Venues
                </span>
                <span className="text-xl font-bold font-serif text-brand-navy">
                  {pendingVenues.length} awaiting
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-ivory/60 p-4 border border-brand-navy/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/60 block">
                  Experience Proposals
                </span>
                <span className="text-xl font-bold font-serif text-brand-navy">
                  {pendingMingles.length} awaiting
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-ivory/60 p-4 border border-brand-navy/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/60 block">
                  Take-Rate
                </span>
                <span className="text-xl font-bold font-serif text-brand-navy">
                  {commissionRate.toFixed(1)}% fee
                </span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-brand-navy/10 pt-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("venues")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "venues"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pending Venues ({pendingVenues.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mingles")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "mingles"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mingle Proposals ({pendingMingles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "settings"
                  ? "border-brand-coral text-brand-coral"
                  : "border-transparent text-brand-navy/60 hover:text-brand-navy hover:border-brand-navy/20"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Platform Settings</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Venues Approval Queue */}
        {activeTab === "venues" && (
          <div className="space-y-4">
            {pendingVenues.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 border border-brand-navy/10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-serif text-brand-navy">
                  Venue Queue Clear!
                </h3>
                <p className="text-xs text-brand-navy/60 max-w-sm mx-auto leading-relaxed">
                  All venue partner registration applications have been reviewed and decided.
                </p>
              </div>
            ) : (
              pendingVenues.map((v) => (
                <VenueApprovalCard
                  key={v.id}
                  venue={v}
                  onDecided={handleVenueDecided}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Mingles Approval Queue */}
        {activeTab === "mingles" && (
          <div className="space-y-4">
            {pendingMingles.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 border border-brand-navy/10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-serif text-brand-navy">
                  Mingle Proposals Queue Clear!
                </h3>
                <p className="text-xs text-brand-navy/60 max-w-sm mx-auto leading-relaxed">
                  All submitted experience proposals have been reviewed and published.
                </p>
              </div>
            ) : (
              pendingMingles.map((m) => (
                <MingleApprovalCard
                  key={m.id}
                  mingle={m}
                  onDecided={handleMingleDecided}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 3: Platform Settings */}
        {activeTab === "settings" && <PlatformCommissionCard />}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
