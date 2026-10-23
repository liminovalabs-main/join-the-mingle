"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { MinglerLogo } from "@/components/brand/mingler-logo";

function RegisterForm({ initialEmail }: { initialEmail: string }) {
  const { openModal, register } = useAuth();
  const [email, setEmail] = React.useState(initialEmail);
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !passwordConfirm) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
      <DialogHeader className="text-center sm:text-center space-y-2">
        <div className="flex justify-center mb-1">
          <MinglerLogo size="text-3xl" />
        </div>
        <DialogTitle className="text-xl font-heading font-black tracking-tight text-brand-ivory">
          Join The Mingler
        </DialogTitle>
        <DialogDescription className="text-xs text-brand-ivory/70">
          Curated London social experiences with remarkable people.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
        {error && (
          <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
            Display Name
          </label>
          <Input
            type="text"
            placeholder="e.g. Alex"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
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
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
            Password (min. 8 characters)
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
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
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
            required
          />
        </div>

        <p className="text-[11px] text-brand-ivory/60 leading-relaxed pt-1">
          By joining, you agree to our Terms of Experience and confirm you are 18+ years of age.
        </p>

        <Button
          type="submit"
          variant="coral"
          isLoading={isLoading}
          className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl mt-2"
        >
          Create Account & Verify
        </Button>
      </form>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-ivory/15" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-brand-navy px-2 text-brand-ivory/50 font-medium">
            Already have an account?
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => openModal("login", email)}
        className="w-full border-brand-ivory/20 text-brand-ivory hover:bg-brand-ivory/10 hover:text-white"
      >
        Sign In Instead
      </Button>
    </>
  );
}

export function RegisterModal() {
  const { activeModal, closeModal, prefilledEmail } = useAuth();
  const isOpen = activeModal === "register";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-brand-navy border-brand-ivory/15 text-brand-ivory p-6 md:p-8">
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
