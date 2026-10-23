"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { MinglerLogo } from "@/components/brand/mingler-logo";

function LoginForm({ initialEmail }: { initialEmail: string }) {
  const { openModal, login } = useAuth();
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <>
      <DialogHeader className="text-center sm:text-center space-y-2">
        <div className="flex justify-center mb-1">
          <MinglerLogo size="text-3xl" />
        </div>
        <DialogTitle className="text-xl font-heading font-black tracking-tight text-brand-ivory">
          Welcome back
        </DialogTitle>
        <DialogDescription className="text-xs text-brand-ivory/70">
          Sign in to book London mingles and connect with your matches.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {error && (
          <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="you@domain.co.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Password
            </label>
            <button
              type="button"
              onClick={() => openModal("forgot-password", email)}
              className="text-xs text-brand-coral hover:underline font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory placeholder:text-brand-ivory/40 focus-visible:ring-brand-coral"
            required
          />
        </div>

        <Button
          type="submit"
          variant="coral"
          isLoading={isLoading}
          className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-brand-ivory/15" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-brand-navy px-2 text-brand-ivory/50 font-medium">
            New to Mingler?
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => openModal("register", email)}
        className="w-full border-brand-ivory/20 text-brand-ivory hover:bg-brand-ivory/10 hover:text-white"
      >
        Create an Account
      </Button>
    </>
  );
}

export function LoginModal() {
  const { activeModal, closeModal, prefilledEmail } = useAuth();
  const isOpen = activeModal === "login";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-brand-navy border-brand-ivory/15 text-brand-ivory p-6 md:p-8">
        {isOpen && (
          <LoginForm
            key={prefilledEmail || "default"}
            initialEmail={prefilledEmail || ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
