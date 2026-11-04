"use client";

import * as React from "react";
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
import { Loader2 } from "lucide-react";

interface SocialAuthButtonsProps {
  mode?: "login" | "register";
}

interface ProviderConfig {
  id: SocialProvider;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  btnClass: string;
  iconClass?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    Icon: GoogleIcon,
    btnClass: "bg-white hover:bg-neutral-100 text-neutral-800 border-white/20 shadow-xs",
  },
  {
    id: "apple",
    name: "Apple",
    Icon: AppleIcon,
    btnClass: "bg-black hover:bg-neutral-900 text-white border-white/20 shadow-xs",
    iconClass: "fill-current text-white",
  },
  {
    id: "facebook",
    name: "Facebook",
    Icon: FacebookIcon,
    btnClass: "bg-brand-navy/60 hover:bg-[#1877F2]/20 text-brand-ivory border-brand-ivory/15 hover:border-[#1877F2]/60",
    iconClass: "text-[#1877F2]",
  },
  {
    id: "instagram",
    name: "Instagram",
    Icon: InstagramIcon,
    btnClass: "bg-brand-navy/60 hover:bg-[#E4405F]/20 text-brand-ivory border-brand-ivory/15 hover:border-[#E4405F]/60",
    iconClass: "text-[#E4405F]",
  },
  {
    id: "tiktok",
    name: "TikTok",
    Icon: TikTokIcon,
    btnClass: "bg-brand-navy/60 hover:bg-white/10 text-brand-ivory border-brand-ivory/15 hover:border-[#FE2C55]/60",
    iconClass: "text-[#FE2C55]",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    Icon: LinkedinIcon,
    btnClass: "bg-brand-navy/60 hover:bg-[#0A66C2]/20 text-brand-ivory border-brand-ivory/15 hover:border-[#0A66C2]/60",
    iconClass: "text-[#0A66C2]",
  },
];

export function SocialAuthButtons({ mode = "login" }: SocialAuthButtonsProps) {
  const { initiateSocialAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = React.useState<SocialProvider | null>(null);

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
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2.5">
        {PROVIDERS.map((provider) => {
          const IconComponent = provider.Icon;
          const isLoading = loadingProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              title={`${actionText} ${provider.name}`}
              aria-label={`${actionText} ${provider.name}`}
              onClick={() => handleProviderClick(provider.id)}
              disabled={loadingProvider !== null}
              className={`h-11 sm:h-12 w-full rounded-xl border flex items-center justify-center gap-2 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${provider.btnClass}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${provider.iconClass || ""}`} />
              )}
              <span className="truncate">{provider.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
