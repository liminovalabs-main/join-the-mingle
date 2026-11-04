"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertCircle, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { ExperienceType, Mingle } from "@/types/mingle";
import { submitMingleProposal } from "@/lib/api/mingles";
import { extractErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXPERIENCE_TYPES: { value: ExperienceType; label: string }[] = [
  { value: "cultural", label: "Arts & Culture" },
  { value: "games", label: "Games & Trivia" },
  { value: "cooking", label: "Cooking Class" },
  { value: "wine_tasting", label: "Wine Tasting" },
  { value: "wellness", label: "Wellness" },
  { value: "physical_activities", label: "Physical Activities" },
  { value: "cocktails", label: "Cocktail Evening" },
  { value: "dinner", label: "Dinner Party" },
  { value: "brunch", label: "Weekend Brunch" },
  { value: "other", label: "Other Gathering" },
];

interface MingleProposalFormProps {
  venueId: string;
  venueName: string;
  onSuccess?: (mingle: Mingle) => void;
}

export function MingleProposalForm({
  venueId,
  venueName,
  onSuccess,
}: MingleProposalFormProps) {
  // Format today's date for HTML5 min attribute (Defect #3 Fix: Past date lockout)
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const [formData, setFormData] = React.useState({
    title: "",
    experience_type: "dinner" as ExperienceType,
    event_date: "",
    start_time: "19:00",
    duration_minutes: 120,
    ticket_price: "35.00",
    capacity: 8,
    age_min: 21,
    age_max: 45,
    description: "",
  });
  const [heroImageFile, setHeroImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (!formData.title.trim()) {
      setErrorMsg("Please provide an experience title.");
      return;
    }
    if (!formData.event_date) {
      setErrorMsg("Please choose an event date.");
      return;
    }
    if (formData.event_date < todayStr) {
      setErrorMsg("Event date cannot be in the past (Defect #3 Past-date guard).");
      return;
    }
    if (formData.age_min < 18) {
      setErrorMsg("Minimum attendee age must be at least 18.");
      return;
    }
    if (formData.age_max < formData.age_min) {
      setErrorMsg("Maximum age cannot be less than minimum age.");
      return;
    }
    if (formData.capacity < 1 || formData.capacity > 50) {
      setErrorMsg("Capacity must be between 1 and 50 attendees.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("venue_id", venueId);
      payload.append("title", formData.title.trim());
      payload.append("experience_type", formData.experience_type);
      payload.append("event_date", formData.event_date);
      payload.append(
        "start_time",
        formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time
      );
      payload.append("duration_minutes", String(formData.duration_minutes));
      payload.append("ticket_price", String(formData.ticket_price));
      payload.append("capacity", String(formData.capacity));
      payload.append("age_min", String(formData.age_min));
      payload.append("age_max", String(formData.age_max));
      payload.append("description", formData.description.trim());
      if (heroImageFile) {
        payload.append("hero_image", heroImageFile);
      }

      const res = await submitMingleProposal(payload);
      toast.success("Mingle experience proposal submitted for founder review!");
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-navy/10 shadow-lg space-y-6">
      <div className="space-y-1 pb-4 border-b border-brand-navy/10">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-coral">
          <Sparkles className="w-3.5 h-3.5" />
          New Experience
        </div>
        <h3 className="text-xl font-bold font-serif text-brand-navy">
          Propose Mingle at {venueName}
        </h3>
        <p className="text-xs text-brand-navy/60 leading-relaxed">
          Submit your curated gathering proposal. Once submitted, our team reviews the concept, ticket price, and age range before publishing live.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="event_title" className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Experience Title <span className="text-brand-coral">*</span>
          </label>
          <Input
            id="event_title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Candlelit Italian Feast & Natural Wines"
            required
            className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="experience_type" className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Experience Type <span className="text-brand-coral">*</span>
            </label>
            <select
              id="experience_type"
              value={formData.experience_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  experience_type: e.target.value as ExperienceType,
                })
              }
              className="w-full rounded-2xl border border-brand-navy/15 bg-white px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral"
            >
              {EXPERIENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket_price" className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Ticket Price (£ GBP) <span className="text-brand-coral">*</span>
            </label>
            <Input
              id="ticket_price"
              type="number"
              step="0.50"
              min="0"
              value={formData.ticket_price}
              onChange={(e) =>
                setFormData({ ...formData, ticket_price: e.target.value })
              }
              placeholder="35.00"
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="event_date" className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Event Date <span className="text-brand-coral">*</span>
            </label>
            <Input
              id="event_date"
              type="date"
              min={todayStr}
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Start Time <span className="text-brand-coral">*</span>
            </label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Duration (Minutes)
            </label>
            <Input
              type="number"
              min="30"
              step="15"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value, 10) || 120,
                })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Capacity (Seats) <span className="text-brand-coral">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="50"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value, 10) || 8,
                })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Min Age (18+)
            </label>
            <Input
              type="number"
              min="18"
              max="99"
              value={formData.age_min}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age_min: parseInt(e.target.value, 10) || 18,
                })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Max Age
            </label>
            <Input
              type="number"
              min="18"
              max="99"
              value={formData.age_max}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age_max: parseInt(e.target.value, 10) || 99,
                })
              }
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Experience Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what's included (welcome drink, 3-course sharing menu, tasting notes), the seating arrangement, and dress code..."
            rows={4}
            className="w-full rounded-2xl border border-brand-navy/15 bg-white p-4 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Hero Photo (Optional)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-brand-navy/20 rounded-2xl bg-brand-ivory/40">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Experience preview"
                className="w-24 h-24 object-cover rounded-xl shadow-xs shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy/40 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="space-y-1 text-center sm:text-left flex-1">
              <input
                type="file"
                id="mingle_proposal_image_input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="mingle_proposal_image_input"
                className="inline-block cursor-pointer rounded-full bg-brand-navy/5 hover:bg-brand-navy/10 px-4 py-2 text-xs font-bold text-brand-navy uppercase tracking-wider transition-colors"
              >
                Choose Photo
              </label>
              <p className="text-[11px] text-brand-navy/60">
                If omitted, Mingler will automatically assign a curated category image.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold uppercase tracking-wider text-xs py-6 shadow-lg shadow-brand-coral/25 active:scale-98 transition-all"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Proposal...
            </span>
          ) : (
            "Submit Experience for Approval"
          )}
        </Button>
      </form>
    </div>
  );
}
