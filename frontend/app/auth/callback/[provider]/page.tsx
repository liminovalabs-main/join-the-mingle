"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MinglerLogo } from "@/components/brand/mingler-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { SocialProvider } from "@/types/auth";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function CallbackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleSocialCallback, openModal } = useAuth();

  const provider = (params?.provider as SocialProvider) || "google";
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const initialError = oauthError
    ? errorDescription || `Authentication was denied or cancelled (${oauthError}).`
    : !code
    ? "Missing authorization code from identity provider."
    : null;

  const [status, setStatus] = React.useState<"processing" | "success" | "error">(
    initialError ? "error" : "processing"
  );
  const [errorMessage, setErrorMessage] = React.useState<string>(initialError || "");

  const executedRef = React.useRef(false);

  React.useEffect(() => {
    if (initialError || !code || executedRef.current) return;
    executedRef.current = true;

    let isMounted = true;
    handleSocialCallback(provider, code, state || undefined)
      .then((success) => {
        if (!isMounted) return;
        if (success) {
          setStatus("success");
          setTimeout(() => {
            router.push("/my-mingler");
          }, 800);
        } else {
          setStatus("error");
          setErrorMessage("Failed to verify social credentials with Mingler server.");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected authentication error occurred."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [code, handleSocialCallback, initialError, provider, router, state]);

  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-brand-navy/90 border border-brand-ivory/15 shadow-2xl backdrop-blur-md text-center text-brand-ivory">
      <div className="flex justify-center mb-6">
        <MinglerLogo size="text-3xl" />
      </div>

      {status === "processing" && (
        <div className="space-y-4 py-6">
          <div className="flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-brand-coral" />
          </div>
          <h2 className="text-xl font-heading font-black tracking-tight">
            Connecting to {providerName}
          </h2>
          <p className="text-xs text-brand-ivory/70 leading-relaxed max-w-xs mx-auto">
            Securing your London social credentials and verifying account status...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4 py-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-heading font-black tracking-tight text-white">
            Authentication Verified
          </h2>
          <p className="text-xs text-brand-ivory/70">
            Welcome to Mingler. Redirecting you to your dashboard...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-5 py-4 animate-in fade-in duration-200">
          <div className="flex justify-center">
            <AlertCircle className="w-10 h-10 text-brand-coral" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-black tracking-tight text-white">
              Authentication Notice
            </h2>
            <p className="text-xs text-red-200/90 mt-2 bg-red-500/15 border border-red-500/25 rounded-xl p-3">
              {errorMessage}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="coral"
              onClick={() => {
                router.push("/");
                setTimeout(() => openModal("login"), 200);
              }}
              className="w-full font-bold uppercase tracking-wider text-xs h-11 rounded-xl"
            >
              Return to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full border-brand-ivory/20 text-brand-ivory hover:bg-brand-ivory/10 text-xs h-10 rounded-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-brand-navy relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-coral/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brand-blue/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        <React.Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-brand-navy/90 border border-brand-ivory/15 text-center text-brand-ivory">
              <Loader2 className="w-8 h-8 animate-spin text-brand-coral mx-auto mb-4" />
              <p className="text-xs text-brand-ivory/70">Loading authentication session...</p>
            </div>
          }
        >
          <CallbackContent />
        </React.Suspense>
      </div>
    </div>
  );
}
