"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { KeyRound } from "lucide-react";

function ForgotPasswordContent({ initialEmail }: { initialEmail: string }) {
  const {
    openModal,
    requestPasswordReset,
    verifyPasswordResetCode,
    confirmPasswordReset,
  } = useAuth();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setIsLoading(true);
    const success = await requestPasswordReset(email);
    setIsLoading(false);
    if (success) setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    setError("");
    setIsLoading(true);
    const success = await verifyPasswordResetCode(email, code);
    setIsLoading(false);
    if (success) setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setIsLoading(true);
    await confirmPasswordReset(email, code, password, passwordConfirm);
    setIsLoading(false);
  };

  return (
    <>
      <DialogHeader className="text-center sm:text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-coral/20 text-brand-coral mb-1">
          <KeyRound className="h-6 w-6" />
        </div>
        <DialogTitle className="text-xl font-heading font-black tracking-tight text-brand-ivory">
          {step === 1 && "Reset Password"}
          {step === 2 && "Enter Reset Code"}
          {step === 3 && "Set New Password"}
        </DialogTitle>
        <DialogDescription className="text-xs text-brand-ivory/70">
          {step === 1 && "Enter your email to receive a 6-digit password reset code."}
          {step === 2 && `Enter the 6-digit code sent to ${email}.`}
          {step === 3 && "Create a secure new password for your Mingler account."}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-200 mt-2">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4 mt-4">
          <div className="space-y-1.5">
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
          <Button
            type="submit"
            variant="coral"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl"
          >
            Send Reset Code
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              6-Digit Reset Code
            </label>
            <Input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono text-xl tracking-widest bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory focus-visible:ring-brand-coral"
              required
            />
          </div>
          <Button
            type="submit"
            variant="coral"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl"
          >
            Verify Code
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-3.5 mt-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              New Password (min. 8 chars)
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory focus-visible:ring-brand-coral"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
              Confirm New Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="bg-brand-navy/60 border-brand-ivory/20 text-brand-ivory focus-visible:ring-brand-coral"
              required
            />
          </div>
          <Button
            type="submit"
            variant="coral"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl mt-2"
          >
            Update Password
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => openModal("login", email)}
          className="text-xs text-brand-ivory/60 hover:text-brand-ivory hover:underline"
        >
          Back to Sign In
        </button>
      </div>
    </>
  );
}

export function ForgotPasswordModal() {
  const { activeModal, closeModal, prefilledEmail } = useAuth();
  const isOpen = activeModal === "forgot-password";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-brand-navy border-brand-ivory/15 text-brand-ivory p-6 md:p-8">
        {isOpen && (
          <ForgotPasswordContent
            key={prefilledEmail || "default"}
            initialEmail={prefilledEmail || ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
