"use client";

import * as React from "react";
import { toast } from "sonner";
import { History, Loader2, Percent, Save, ShieldAlert } from "lucide-react";
import { PlatformSettingAudit } from "@/types/admin";
import { getCommissionSettings, updateCommissionRate } from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PlatformCommissionCard() {
  const [currentRate, setCurrentRate] = React.useState<number>(10.0);
  const [history, setHistory] = React.useState<PlatformSettingAudit[]>([]);
  const [rateInput, setRateInput] = React.useState<string>("10.0");
  const [notesInput, setNotesInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getCommissionSettings();
      setCurrentRate(data.commission_rate);
      setRateInput(String(data.commission_rate));
      setHistory(data.history || []);
    } catch (err: unknown) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedRate = parseFloat(rateInput);
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setErrorMsg("Commission rate must be a valid number between 0% and 100%.");
      return;
    }

    setUpdating(true);
    try {
      const res = await updateCommissionRate(parsedRate, notesInput.trim());
      toast.success(res.message || `Commission updated to ${parsedRate}%`);
      setCurrentRate(parsedRate);
      setNotesInput("");
      // Refresh audit trail
      const refreshed = await getCommissionSettings();
      setHistory(refreshed.history || []);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 border border-brand-navy/10 flex items-center justify-center min-h-[240px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-coral" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rate Controller Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-navy/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral">
              <Percent className="w-3.5 h-3.5" />
              Platform Economics
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-navy">
              Default Commission Rate
            </h3>
            <p className="text-xs text-brand-navy/60">
              Configures the platform take-rate percentage deducted from ticket transactions for newly registered venues.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-brand-ivory/80 px-5 py-3 rounded-2xl border border-brand-navy/10 shrink-0">
            <span className="text-xs text-brand-navy/60 font-medium">Active Rate:</span>
            <span className="text-2xl font-black font-serif text-brand-navy">
              {currentRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                New Rate (%) <span className="text-brand-coral">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  required
                  className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5 pr-8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-navy/40">
                  %
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                Audit Notes / Change Rationale
              </label>
              <Input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Q4 holiday season commission adjustment"
                className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={updating}
              className="rounded-full bg-brand-navy hover:bg-brand-navy/90 text-white font-bold uppercase tracking-wider text-xs px-7 py-5 shadow-md active:scale-95 transition-all"
            >
              {updating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" />
                  Apply Commission Rate
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Historical Audit Trail */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-coral" />
          <h4 className="text-lg font-bold font-serif text-brand-navy">
            Versioned Audit Trail
          </h4>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-brand-navy/50 italic py-4">
            No historical commission changes recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-navy/10 text-brand-navy/50 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Commission %</th>
                  <th className="py-3 px-3">Updated By</th>
                  <th className="py-3 px-3">Reason / Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-brand-ivory/40">
                    <td className="py-3.5 px-3 font-medium text-brand-navy whitespace-nowrap">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-brand-coral">
                      {typeof record.value === "number"
                        ? `${record.value.toFixed(1)}%`
                        : `${record.value}%`}
                    </td>
                    <td className="py-3.5 px-3 text-brand-navy/70 whitespace-nowrap">
                      {record.updated_by_email || "System Default"}
                    </td>
                    <td className="py-3.5 px-3 text-brand-navy/60 italic">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
