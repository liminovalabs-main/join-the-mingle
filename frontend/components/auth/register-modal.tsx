"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { MinglerLogo } from "@/components/brand/mingler-logo";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Check, Circle } from "lucide-react";

function RegisterForm({ initialEmail }: { initialEmail: string }) {
  const { openModal, register } = useAuth();
  const [email, setEmail] = React.useState(initialEmail);
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [isPasswordFocused, setIsPasswordFocused] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = Boolean(
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm
  );
  const showChecklist = isPasswordFocused || password.length > 0 || passwordConfirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !passwordConfirm) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!hasNumber) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!hasSpecialChar) {
      setError("Password must contain at least one special character.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);
    await register(email, password, passwordConfirm, displayName);
    setIsLoading(false);
  };

  return (
    <>
      <DialogHeader className="text-center sm:text-center space-y-1">
        <div className="flex justify-center mb-0.5">
          <MinglerLogo size="text-2xl" />
        </div>
        <DialogTitle className="text-xl font-heading font-black tracking-tight text-brand-ivory">
          Join The Mingler
        </DialogTitle>
        <DialogDescription className="text-xs text-brand-ivory/70 max-w-sm mx-auto">
          Curated London social experiences with remarkable people.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-3">
        <SocialAuthButtons mode="register" />
      </div>

      <div className="relative my-2.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-ivory/15" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-brand-navy px-2 text-brand-ivory/50 font-medium">
            or with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Responsive 2-column grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral h-10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="alex@domain.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral h-10"
              required
            />
          </div>
        </div>

        {/* Passwords row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral h-10"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral h-10"
              required
            />
          </div>
        </div>

        {/* Real-time Password Requirements Checklist */}
        {showChecklist && (
          <div className="rounded-xl bg-brand-navy/90 border border-brand-ivory/15 p-2.5 sm:p-3 space-y-1.5 animate-in fade-in-50 duration-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ivory/70">
              Password Requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <div
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  hasMinLength
                    ? "text-emerald-400 font-medium"
                    : "text-brand-ivory/50"
                }`}
              >
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-brand-ivory/30 shrink-0" />
                )}
                <span>8+ characters</span>
              </div>

              <div
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  hasNumber
                    ? "text-emerald-400 font-medium"
                    : "text-brand-ivory/50"
                }`}
              >
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-brand-ivory/30 shrink-0" />
                )}
                <span>At least 1 number</span>
              </div>

              <div
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  hasSpecialChar
                    ? "text-emerald-400 font-medium"
                    : "text-brand-ivory/50"
                }`}
              >
                {hasSpecialChar ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-brand-ivory/30 shrink-0" />
                )}
                <span>Special symbol (!@#$...)</span>
              </div>

              <div
                className={`flex items-center gap-2 transition-colors duration-200 ${
                  passwordsMatch
                    ? "text-emerald-400 font-medium"
                    : "text-brand-ivory/50"
                }`}
              >
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-brand-ivory/30 shrink-0" />
                )}
                <span>Passwords match</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-brand-ivory/60 leading-relaxed text-center sm:text-left">
          By joining, you agree to our Terms of Experience and confirm you are 18+ years of age.
        </p>

        <Button
          type="submit"
          variant="coral"
          isLoading={isLoading}
          className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl mt-1 shadow-md cursor-pointer"
        >
          Create Account & Verify
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-brand-ivory/70">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => openModal("login", email)}
          className="text-brand-coral hover:underline font-bold cursor-pointer transition-colors ml-1"
        >
          Sign in instead
        </button>
      </div>
    </>
  );
}

export function RegisterModal() {
  const { activeModal, closeModal, prefilledEmail } = useAuth();
  const isOpen = activeModal === "register";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-xl bg-brand-navy border-brand-ivory/15 text-brand-ivory p-6 sm:p-7 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {isOpen && (
          <RegisterForm
            key={prefilledEmail || "default"}
            initialEmail={prefilledEmail || ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
