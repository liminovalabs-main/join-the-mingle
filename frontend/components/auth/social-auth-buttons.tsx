"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { useAuth } from "@/context/auth-context";
import { SocialProvider } from "@/types/auth";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface SocialAuthButtonsProps {
  mode?: "login" | "register";
}

export function SocialAuthButtons({ mode = "login" }: SocialAuthButtonsProps) {
  const { initiateSocialAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = React.useState<SocialProvider | null>(null);
  const [showMore, setShowMore] = React.useState(false);

  const handleProviderClick = async (provider: SocialProvider) => {
    try {
      setLoadingProvider(provider);
      await initiateSocialAuth(provider);
    } finally {
      setLoadingProvider(null);
    }
  };

  const actionText = mode === "login" ? "Continue with" : "Sign up with";

  return (
    <div className="w-full space-y-2.5">
      {/* Primary: Google & Apple in 2-column grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Primary: Google */}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleProviderClick("google")}
          disabled={loadingProvider !== null}
          className="w-full h-10 sm:h-11 bg-white hover:bg-neutral-100 text-neutral-800 border-white/20 font-medium text-xs sm:text-xs md:text-sm flex items-center justify-center gap-2.5 transition-colors rounded-xl shadow-xs"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
          ) : (
            <GoogleIcon className="w-4 h-4 shrink-0" />
          )}
          <span>{actionText} Google</span>
        </Button>

        {/* Primary: Apple */}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleProviderClick("apple")}
          disabled={loadingProvider !== null}
          className="w-full h-10 sm:h-11 bg-black hover:bg-neutral-900 text-white border-white/20 font-medium text-xs sm:text-xs md:text-sm flex items-center justify-center gap-2.5 transition-colors rounded-xl shadow-xs"
        >
          {loadingProvider === "apple" ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <AppleIcon className="w-4 h-4 shrink-0 fill-current text-white" />
          )}
          <span>{actionText} Apple</span>
        </Button>
      </div>

      {/* Expandable secondary providers (Facebook, Instagram, TikTok, LinkedIn) */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-brand-ivory/60 hover:text-brand-ivory transition-colors cursor-pointer"
        >
          <span>More social accounts</span>
          {showMore ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {showMore && (
          <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in-50 duration-200">
            {/* Facebook */}
            <button
              type="button"
              title={`${actionText} Facebook`}
              aria-label={`${actionText} Facebook`}
              onClick={() => handleProviderClick("facebook")}
              disabled={loadingProvider !== null}
              className="h-10 rounded-xl bg-brand-navy/60 hover:bg-brand-navy border border-brand-ivory/15 flex items-center justify-center text-brand-ivory hover:text-[#1877F2] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingProvider === "facebook" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FacebookIcon className="w-4 h-4" />
              )}
            </button>

            {/* Instagram */}
            <button
              type="button"
              title={`${actionText} Instagram`}
              aria-label={`${actionText} Instagram`}
              onClick={() => handleProviderClick("instagram")}
              disabled={loadingProvider !== null}
              className="h-10 rounded-xl bg-brand-navy/60 hover:bg-brand-navy border border-brand-ivory/15 flex items-center justify-center text-brand-ivory hover:text-[#E4405F] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingProvider === "instagram" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <InstagramIcon className="w-4 h-4" />
              )}
            </button>

            {/* TikTok */}
            <button
              type="button"
              title={`${actionText} TikTok`}
              aria-label={`${actionText} TikTok`}
              onClick={() => handleProviderClick("tiktok")}
              disabled={loadingProvider !== null}
              className="h-10 rounded-xl bg-brand-navy/60 hover:bg-brand-navy border border-brand-ivory/15 flex items-center justify-center text-brand-ivory hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingProvider === "tiktok" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TikTokIcon className="w-4 h-4" />
              )}
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              title={`${actionText} LinkedIn`}
              aria-label={`${actionText} LinkedIn`}
              onClick={() => handleProviderClick("linkedin")}
              disabled={loadingProvider !== null}
              className="h-10 rounded-xl bg-brand-navy/60 hover:bg-brand-navy border border-brand-ivory/15 flex items-center justify-center text-brand-ivory hover:text-[#0A66C2] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingProvider === "linkedin" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkedinIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
