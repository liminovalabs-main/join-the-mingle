"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Image as ImageIcon, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { registerVenue } from "@/lib/api/venues";
import { extractErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LONDON_AREAS = [
  "Shoreditch",
  "Soho",
  "Mayfair",
  "Covent Garden",
  "Fitzrovia",
  "London Bridge",
  "Brixton",
  "Notting Hill",
  "Kensington",
  "Camden",
  "Chelsea",
  "City of London",
  "Marylebone",
  "Islington",
  "Hackney",
];

const CATEGORIES = [
  "Cocktail Bar",
  "Wine Lounge",
  "Restaurant",
  "Rooftop Terrace",
  "Activity Space",
  "Hotel Lounge",
  "Art Gallery",
  "Social Club",
  "Other",
];

export function VenueRegistrationForm() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, openModal, refreshProfile } = useAuth();

  const [formData, setFormData] = React.useState({
    name: "",
    category: CATEGORIES[0],
    area: LONDON_AREAS[0],
    address: "",
    postcode: "",
    description: "",
  });
  const [heroImageFile, setHeroImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successVenue, setSuccessVenue] = React.useState<{ name: string; id: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || !formData.address.trim() || !formData.postcode.trim()) {
      setErrorMsg("Please fill in all required fields (Name, Address, Postcode).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("category", formData.category);
      payload.append("area", formData.area);
      payload.append("address", formData.address.trim());
      payload.append("postcode", formData.postcode.trim());
      payload.append("description", formData.description.trim());
      if (heroImageFile) {
        payload.append("hero_image", heroImageFile);
      }

      const res = await registerVenue(payload);
      await refreshProfile();
      setSuccessVenue({ name: res.name, id: res.id });
      toast.success("Venue application submitted successfully!");
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-coral" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-white p-8 sm:p-10 border border-brand-navy/10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-brand-navy">Partner With Mingler</h2>
          <p className="text-sm text-brand-navy/70 leading-relaxed">
            Join London&apos;s most curated hospitality network. Host intimate dinner parties, wine tastings,
            and social evenings at your venue.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            onClick={() => openModal("login")}
            variant="outline"
            className="rounded-full border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5 font-bold uppercase tracking-wider text-xs px-6 py-5"
          >
            Log In
          </Button>
          <Button
            type="button"
            onClick={() => openModal("register")}
            className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 font-bold uppercase tracking-wider text-xs px-6 py-5 shadow-lg shadow-brand-coral/20"
          >
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (!user.is_email_verified) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-white p-8 sm:p-10 border border-brand-navy/10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-brand-navy">Email Verification Required</h2>
          <p className="text-sm text-brand-navy/70 leading-relaxed">
            To ensure the integrity of our venue partners, please verify your email address (
            <span className="font-semibold text-brand-navy">{user.email}</span>) before registering a venue.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => openModal("verify-email", user.email)}
          className="rounded-full bg-brand-coral text-white hover:bg-brand-coral/90 font-bold uppercase tracking-wider text-xs px-8 py-5 shadow-lg shadow-brand-coral/20"
        >
          Verify Email Now
        </Button>
      </div>
    );
  }

  if (successVenue) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-white p-8 sm:p-10 border border-brand-navy/10 shadow-xl text-center space-y-6 animate-in fade-in-0 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif text-brand-navy">Application Received!</h2>
          <p className="text-sm text-brand-navy/70 leading-relaxed">
            Thank you for applying to host with Mingler. Your venue{" "}
            <span className="font-semibold text-brand-navy">&ldquo;{successVenue.name}&rdquo;</span> is currently
            in the curator review queue. You can now access your Venue Dashboard to prepare upcoming experiences.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/venue/dashboard")}
          className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 font-bold uppercase tracking-wider text-xs px-8 py-5 shadow-lg"
        >
          Go to Venue Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto rounded-3xl bg-white p-6 sm:p-10 border border-brand-navy/10 shadow-xl space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-coral/10 text-brand-coral text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5" />
          Partner Application
        </div>
        <h1 className="text-3xl font-extrabold font-serif text-brand-navy tracking-tight">
          Register Your Venue
        </h1>
        <p className="text-sm text-brand-navy/70 leading-relaxed">
          Provide your venue details below. Once submitted, our team reviews applications within 24 hours.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Venue Name <span className="text-brand-coral">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. The Shoreditch Speakeasy"
            required
            className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Category <span className="text-brand-coral">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-2xl border border-brand-navy/15 bg-white px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              London Area / Borough <span className="text-brand-coral">*</span>
            </label>
            <select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full rounded-2xl border border-brand-navy/15 bg-white px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral"
            >
              {LONDON_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Street Address <span className="text-brand-coral">*</span>
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 14 Curtain Road"
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Postcode <span className="text-brand-coral">*</span>
            </label>
            <Input
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              placeholder="EC2A 3HJ"
              required
              className="rounded-2xl border-brand-navy/15 focus-visible:ring-brand-coral py-5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Description & Atmosphere
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us about your venue vibe, music, culinary focus, and why Mingler members will love gathering here..."
            rows={4}
            className="w-full rounded-2xl border border-brand-navy/15 bg-white p-4 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-coral leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Hero / Cover Image (Optional)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-brand-navy/20 rounded-2xl bg-brand-ivory/40">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Venue preview"
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
                id="hero_image_input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="hero_image_input"
                className="inline-block cursor-pointer rounded-full bg-brand-navy/5 hover:bg-brand-navy/10 px-4 py-2 text-xs font-bold text-brand-navy uppercase tracking-wider transition-colors"
              >
                Choose Photo
              </label>
              <p className="text-[11px] text-brand-navy/60">
                PNG, JPG or WebP up to 5MB. Showcase your interior or main bar.
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
              Submitting Application...
            </span>
          ) : (
            "Submit Venue Application"
          )}
        </Button>
      </form>
    </div>
  );
}
