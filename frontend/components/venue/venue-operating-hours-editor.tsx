"use client";

import * as React from "react";
import { toast } from "sonner";
import { Clock, Loader2, Save } from "lucide-react";
import { VenueOpeningHour } from "@/types/venue";
import { VenueOpeningHourInput } from "@/types/admin";
import { updateVenueOpeningHours } from "@/lib/api/venues";
import { extractErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

const DAYS_OF_WEEK = [
  { day: 0, name: "Monday" },
  { day: 1, name: "Tuesday" },
  { day: 2, name: "Wednesday" },
  { day: 3, name: "Thursday" },
  { day: 4, name: "Friday" },
  { day: 5, name: "Saturday" },
  { day: 6, name: "Sunday" },
];

interface VenueOperatingHoursEditorProps {
  venueId: string;
  initialHours?: VenueOpeningHour[];
  onUpdated?: (updated: VenueOpeningHour[]) => void;
}

interface ScheduleState {
  day_of_week: number;
  open_time: string; // "HH:MM"
  close_time: string; // "HH:MM"
  is_closed: boolean;
}

function formatTimeToHHMM(timeStr: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
}

export function VenueOperatingHoursEditor({
  venueId,
  initialHours = [],
  onUpdated,
}: VenueOperatingHoursEditorProps) {
  const [schedule, setSchedule] = React.useState<ScheduleState[]>(() => {
    return DAYS_OF_WEEK.map(({ day }) => {
      const existing = initialHours.find((h) => h.day_of_week === day);
      if (existing) {
        return {
          day_of_week: day,
          open_time: formatTimeToHHMM(existing.open_time),
          close_time: formatTimeToHHMM(existing.close_time),
          is_closed: existing.is_closed,
        };
      }
      return {
        day_of_week: day,
        open_time: "17:00",
        close_time: "23:00",
        is_closed: false,
      };
    });
  });

  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleToggleClosed = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, is_closed: !item.is_closed } : item
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "open_time" | "close_time",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((item, idx) =>
        idx === dayIndex ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validation: every non-closed day must have valid open and close times
    for (const item of schedule) {
      if (!item.is_closed) {
        if (!item.open_time || !item.close_time) {
          const dayName = DAYS_OF_WEEK.find((d) => d.day === item.day_of_week)?.name;
          const msg = `Please enter both open and close times for ${dayName}, or mark it as closed.`;
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload: VenueOpeningHourInput[] = schedule.map((item) => ({
        day_of_week: item.day_of_week,
        open_time: item.is_closed
          ? null
          : item.open_time.length === 5
          ? `${item.open_time}:00`
          : item.open_time,
        close_time: item.is_closed
          ? null
          : item.close_time.length === 5
          ? `${item.close_time}:00`
          : item.close_time,
        is_closed: item.is_closed,
      }));

      const res = await updateVenueOpeningHours(venueId, payload);
      toast.success("Operating schedule updated successfully!");
      if (onUpdated) {
        onUpdated(res);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-navy/10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral mb-1">
            <Clock className="w-3.5 h-3.5" />
            Defect #8 Fix
          </div>
          <h3 className="text-xl font-bold font-serif text-brand-navy">
            7-Day Operating Hours
          </h3>
          <p className="text-xs text-brand-navy/60">
            Set verified opening and closing hours for each day of the week.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand-navy hover:bg-brand-navy/90 text-white font-bold uppercase tracking-wider text-xs px-6 py-5 shrink-0 shadow-md active:scale-95 transition-all"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save Schedule
            </span>
          )}
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3">
        {schedule.map((item, idx) => {
          const day = DAYS_OF_WEEK[idx];
          return (
            <div
              key={item.day_of_week}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.is_closed
                  ? "bg-brand-navy/5 border-brand-navy/10 opacity-75"
                  : "bg-white border-brand-navy/15 hover:border-brand-navy/25"
              }`}
            >
              <div className="w-32 shrink-0">
                <span className="font-bold text-sm text-brand-navy">
                  {day.name}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-1">
                {item.is_closed ? (
                  <span className="text-xs font-semibold text-brand-navy/50 italic py-2">
                    Closed all day
                  </span>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/60">
                        Open
                      </span>
                      <input
                        type="time"
                        value={item.open_time}
                        onChange={(e) =>
                          handleTimeChange(idx, "open_time", e.target.value)
                        }
                        aria-label={`${day.name} open time`}
                        className="rounded-xl border border-brand-navy/15 bg-brand-ivory/30 px-3 py-1.5 text-xs text-brand-navy font-semibold focus:outline-none focus:ring-2 focus:ring-brand-coral"
                      />
                    </div>
                    <span className="text-brand-navy/40 font-bold">—</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/60">
                        Close
                      </span>
                      <input
                        type="time"
                        value={item.close_time}
                        onChange={(e) =>
                          handleTimeChange(idx, "close_time", e.target.value)
                        }
                        aria-label={`${day.name} close time`}
                        className="rounded-xl border border-brand-navy/15 bg-brand-ivory/30 px-3 py-1.5 text-xs text-brand-navy font-semibold focus:outline-none focus:ring-2 focus:ring-brand-coral"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-brand-navy/80 font-medium">
                  <input
                    type="checkbox"
                    checked={item.is_closed}
                    onChange={() => handleToggleClosed(idx)}
                    className="w-4 h-4 rounded border-brand-navy/20 text-brand-coral focus:ring-brand-coral cursor-pointer"
                  />
                  <span>Closed</span>
                </label>
              </div>
            </div>
          );
        })}
      </form>
    </div>
  );
}
