"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Volume2, Bell, Loader2, Upload, Camera, Trash2, Image as ImageIcon } from "lucide-react";
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { apiClient, extractErrorMessage } from "@/lib/api/client";
import { SocialAccount, SocialAccountListResponse, SocialProvider } from "@/types/auth";

const SUGGESTED_INTERESTS = [
  "Wine Tasting",
  "Cocktail Mixing",
  "Supper Clubs",
  "Jazz & Live Music",
  "Contemporary Art",
  "Theater & West End",
  "Culinary Arts",
  "Tech & Startups",
  "Running & Fitness",
  "Book Clubs",
  "Philosophy",
  "Coffee & Roasteries",
];

const SOCIAL_PROVIDERS: Array<{
  id: SocialProvider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "google", name: "Google", icon: GoogleIcon },
  { id: "apple", name: "Apple", icon: AppleIcon },
  { id: "facebook", name: "Facebook", icon: FacebookIcon },
  { id: "instagram", name: "Instagram", icon: InstagramIcon },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon },
  { id: "linkedin", name: "LinkedIn", icon: LinkedinIcon },
  ];

export function ProfileEditor() {
  const { profile, updateProfile, refreshProfile, initiateSocialAuth } = useAuth();

  const [displayName, setDisplayName] = React.useState(profile?.display_name || "");
  const [photo, setPhoto] = React.useState(profile?.photo || "");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [bio, setBio] = React.useState(profile?.bio || "");
  const [gender, setGender] = React.useState(profile?.gender || "");
  const [relationshipStatus, setRelationshipStatus] = React.useState(
    profile?.relationship_status || ""
  );
  const [dateOfBirth, setDateOfBirth] = React.useState(profile?.date_of_birth || "");
  const [interests, setInterests] = React.useState<string[]>(profile?.interests || []);
  const [instagramHandle, setInstagramHandle] = React.useState(
    profile?.instagram_handle || ""
  );
  const [linkedinUrl, setLinkedinUrl] = React.useState(profile?.linkedin_url || "");
  const [soundEnabled, setSoundEnabled] = React.useState(
    profile?.sound_enabled ?? true
  );
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    profile?.notifications_enabled ?? true
  );

  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [linkedAccounts, setLinkedAccounts] = React.useState<SocialAccount[]>([]);
  const [unlinkingProvider, setUnlinkingProvider] = React.useState<SocialProvider | null>(null);
  const [connectingProvider, setConnectingProvider] = React.useState<SocialProvider | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    apiClient
      .get<SocialAccountListResponse>("/auth/social/accounts/")
      .then((res) => {
        if (isMounted && res.data?.social_accounts) {
          setLinkedAccounts(res.data.social_accounts);
        }
      })
      .catch((err) => {
        console.warn("Could not load linked social accounts", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhoto(profile.photo || "");
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setRelationshipStatus(profile.relationship_status || "");
      setDateOfBirth(profile.date_of_birth || "");
      setInterests(profile.interests || []);
      setInstagramHandle(profile.instagram_handle || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setSoundEnabled(profile.sound_enabled ?? true);
      setNotificationsEnabled(profile.notifications_enabled ?? true);
    }
  }, [profile]);

  React.useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleDisconnect = async (provider: SocialProvider) => {
    try {
      setUnlinkingProvider(provider);
      await apiClient.delete(`/auth/social/accounts/${provider}/`);
      setLinkedAccounts((prev) => prev.filter((acc) => acc.provider !== provider));
      toast.success(
        `Disconnected ${provider.charAt(0).toUpperCase() + provider.slice(1)} account.`
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const handleConnect = async (provider: SocialProvider) => {
    try {
      setConnectingProvider(provider);
      await initiateSocialAuth(provider);
    } finally {
      setConnectingProvider(null);
    }
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPEG, WEBP, or GIF).");
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image file must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(objectUrl);
    toast.success("Photo selected from device. Click 'Save Changes' to apply.");
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhoto("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Photo cleared. Click 'Save Changes' to update.");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!displayName.trim()) {
      errs.displayName = "Display name is required.";
    }

    // Defect #6 Fix: Instagram Regex Validation
    if (instagramHandle.trim()) {
      const cleanHandle = instagramHandle.trim().replace(/^@/, "");
      const igRegex = /^[a-zA-Z0-9._]{1,30}$/;
      if (!igRegex.test(cleanHandle)) {
        errs.instagramHandle =
          "Valid handle letters, numbers, dots, and underscores (max 30 chars).";
      }
    }

    // Defect #6 Fix: LinkedIn URL Regex Validation
    if (linkedinUrl.trim()) {
      const liRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
      if (!liRegex.test(linkedinUrl.trim())) {
        errs.linkedinUrl =
          "Enter a valid profile URL (e.g., https://linkedin.com/in/your-name).";
      }
    }

    // 18+ Age Guard (UK GDPR Compliance)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errs.dateOfBirth = "You must be at least 18 years old to join Mingler.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    let success = false;

    if (photoFile) {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("display_name", displayName.trim());
      formData.append("bio", bio.trim());
      if (gender) formData.append("gender", gender);
      if (relationshipStatus) formData.append("relationship_status", relationshipStatus);
      if (dateOfBirth) formData.append("date_of_birth", dateOfBirth);
      formData.append("interests", JSON.stringify(interests));
      formData.append("instagram_handle", instagramHandle.trim().replace(/^@/, ""));
      formData.append("linkedin_url", linkedinUrl.trim());
      formData.append("sound_enabled", String(soundEnabled));
      formData.append("notifications_enabled", String(notificationsEnabled));

      success = await updateProfile(formData);
      if (success) {
        setPhotoFile(null);
      }
    } else {
      success = await updateProfile({
        display_name: displayName.trim(),
        photo: photo.trim(),
        bio: bio.trim(),
        gender: gender as "Male" | "Female" | "Prefer not to say" | "",
        relationship_status: relationshipStatus as
          | "Single"
          | "Married"
          | "It's complicated"
          | "",
        date_of_birth: dateOfBirth || undefined,
        interests,
        instagram_handle: instagramHandle.trim().replace(/^@/, ""),
        linkedin_url: linkedinUrl.trim(),
        sound_enabled: soundEnabled,
        notifications_enabled: notificationsEnabled,
      });
    }

    setIsSaving(false);
    if (success) {
      await refreshProfile();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "M";
    return name
      .trim()
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
      {/* Profile Header & Avatar Card */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white border border-border shadow-xs">
        {/* Defect #1 permanent enforcement: aspect-square shrink-0 object-cover */}
        <div className="relative group shrink-0">
          <Avatar className="h-24 w-24 border-2 border-brand-coral/40 shadow-sm aspect-square">
            {(photoPreview || photo) && (
              <AvatarImage
                src={photoPreview || photo}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-xl font-black bg-brand-coral/15 text-brand-coral">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus:opacity-100"
            title="Upload photo from device"
            aria-label="Upload photo from device"
          >
            <Camera className="h-6 w-6 mb-0.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2.5">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-heading font-black tracking-tight text-brand-navy">
              {displayName || "Member"}
            </h2>
            <Badge variant="coral" className="text-[10px] font-bold">
              {profile?.role || "Member"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {profile?.email}
          </p>

          {/* Device Upload and Photo Actions */}
          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png, image/jpeg, image/webp, image/gif"
              className="hidden"
              data-testid="profile-photo-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-brand-coral/40 text-brand-navy hover:bg-brand-coral/10 hover:border-brand-coral"
            >
              <Upload className="h-3.5 w-3.5 text-brand-coral" />
              <span>Upload from Device</span>
            </Button>

            {(photoPreview || photo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Photo
              </Button>
            )}

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-muted-foreground hover:text-brand-navy underline ml-1 cursor-pointer"
            >
              {showUrlInput ? "Hide URL option" : "Or use image URL"}
            </button>
          </div>

          {photoFile && (
            <p className="text-[11px] text-emerald-600 font-medium">
              ✓ Ready to upload: {photoFile.name} (Click &apos;Save Changes&apos; below)
            </p>
          )}

          {showUrlInput && (
            <div className="pt-2 max-w-md">
              <Input
                type="url"
                placeholder="Paste photo URL (https://...)"
                value={photo}
                onChange={(e) => {
                  setPhoto(e.target.value);
                  setPhotoFile(null);
                  if (photoPreview && photoPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(photoPreview);
                    setPhotoPreview(null);
                  }
                }}
                className="h-8 text-xs bg-brand-stone/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Basic Profile Details */}
      <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-5">
        <h3 className="text-base font-heading font-black tracking-tight text-brand-navy border-b border-border pb-3">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display Name *
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              placeholder="e.g. Alex Henderson"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dob-input"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Date of Birth (18+ requirement)
            </label>
            <Input
              id="dob-input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              error={errors.dateOfBirth}
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>UK GDPR Private — Never shared on public attendee lists.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral cursor-pointer"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Relationship Status
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral cursor-pointer"
            >
              <option value="">Select status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="It's complicated">It&apos;s complicated</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bio (Tell fellow minglers about yourself)
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Architecture lover, jazz enthusiast, and East London foodie..."
            className="flex w-full rounded-xl border border-input bg-white p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral"
          />
        </div>
      </div>

      {/* Defect #6 Fix: Social Media Handles with Strict Validation */}
      <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
        <h3 className="text-base font-heading font-black tracking-tight text-brand-navy border-b border-border pb-3">
          Social Links (Shared with mutual matches only)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
              Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-sm text-muted-foreground">@</span>
              <Input
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                error={errors.instagramHandle}
                placeholder="username"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" />
              LinkedIn Profile URL
            </label>
            <Input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              error={errors.linkedinUrl}
              placeholder="https://linkedin.com/in/alex"
            />
          </div>
        </div>
      </div>

      {/* Interests Picker */}
      <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
        <h3 className="text-base font-heading font-black tracking-tight text-brand-navy border-b border-border pb-3">
          Interests & Vibes
        </h3>
        <p className="text-xs text-muted-foreground">
          Select topics you enjoy discussing at curated tables.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTED_INTERESTS.map((tag) => {
            const isSelected = interests.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-coral text-white shadow-xs"
                    : "bg-brand-stone/40 text-brand-navy hover:bg-brand-stone/70"
                }`}
              >
                {isSelected ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* App Preferences */}
      <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
        <h3 className="text-base font-heading font-black tracking-tight text-brand-navy border-b border-border pb-3">
          App Preferences
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-brand-stone/10 cursor-pointer">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-brand-navy/80" />
              <div>
                <p className="text-xs font-bold text-brand-navy">Sound Effects</p>
                <p className="text-[11px] text-muted-foreground">
                  Play melodic Web Audio chimes on connection reveals.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-brand-coral accent-brand-coral cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-brand-stone/10 cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-brand-navy/80" />
              <div>
                <p className="text-xs font-bold text-brand-navy">Email Notifications</p>
                <p className="text-[11px] text-muted-foreground">
                  Receive booking confirmations and post-mingle matching invitations.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-brand-coral accent-brand-coral cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Connected Social Accounts */}
      <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-base font-heading font-black tracking-tight text-brand-navy">
            Connected Accounts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link your social profiles for one-click authentication and verified profile badges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const isLinked = linkedAccounts.some((acc) => acc.provider === provider.id);
            const isUnlinking = unlinkingProvider === provider.id;
            const isConnecting = connectingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-brand-stone/10 hover:bg-brand-stone/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-brand-navy shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-navy">{provider.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {isLinked ? (
                        <span className="text-emerald-600 font-medium">Connected</span>
                      ) : (
                        <span>Not connected</span>
                      )}
                    </p>
                  </div>
                </div>

                {isLinked ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUnlinking}
                    onClick={() => handleDisconnect(provider.id)}
                    className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                  >
                    {isUnlinking ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isConnecting}
                    onClick={() => handleConnect(provider.id)}
                    className="h-8 px-3 text-xs text-brand-navy hover:text-brand-navy hover:bg-white border-border cursor-pointer"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="coral"
          isLoading={isSaving}
          className="px-8 h-12 text-sm font-bold uppercase tracking-wider rounded-xl shadow-md"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
