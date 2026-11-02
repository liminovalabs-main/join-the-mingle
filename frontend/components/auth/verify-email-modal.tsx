"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { MailCheck, RefreshCw } from "lucide-react";

function VerifyEmailContent({ email }: { email: string }) {
  const { verifyEmail, resendVerification } = useAuth();
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  React.useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown timer for resend code
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = "";
      setDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    const completeCode = updated.join("");
    if (completeCode.length === 6 && !updated.includes("")) {
      handleVerify(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setDigits(updated);

    const nextIndex = Math.min(pasted.length, 5);
    inputsRef.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join("");
    if (code.length !== 6) return;

    setIsLoading(true);
    await verifyEmail(email, code);
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    const success = await resendVerification(email);
    setIsResending(false);
    if (success) {
      setCountdown(60);
      setCanResend(false);
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    }
  };

  return (
    <>
      <DialogHeader className="text-center sm:text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-coral/20 text-brand-coral mb-1">
          <MailCheck className="h-6 w-6" />
        </div>
        <DialogTitle className="text-xl font-heading font-black tracking-tight text-brand-ivory">
          Verify Your Email
        </DialogTitle>
        <DialogDescription className="text-xs text-brand-ivory/70 max-w-xs mx-auto">
          We sent a 6-digit confirmation code to{" "}
          <span className="font-semibold text-brand-ivory underline">{email}</span>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 my-4">
        {/* 6 Digit Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-bold font-heading rounded-xl border border-brand-ivory/20 bg-brand-navy/80 text-brand-ivory focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/40 focus:outline-none transition-all shadow-inner"
            />
          ))}
        </div>

        <Button
          type="button"
          variant="coral"
          isLoading={isLoading}
          disabled={digits.some((d) => d === "")}
          onClick={() => handleVerify()}
          className="w-full h-11 text-sm font-bold uppercase tracking-wider rounded-xl"
        >
          Confirm & Activate
        </Button>

        {/* Resend Action with Rate-Limit Countdown */}
        <div className="text-center pt-2">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-xs text-brand-coral hover:underline font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              Resend 6-Digit Code
            </button>
          ) : (
            <p className="text-xs text-brand-ivory/50">
              Resend code in <span className="font-mono font-bold text-brand-ivory/80">{countdown}s</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export function VerifyEmailModal() {
  const { activeModal, closeModal, prefilledEmail } = useAuth();
  const isOpen = activeModal === "verify-email";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-brand-navy border-brand-ivory/15 text-brand-ivory p-6 md:p-8">
        {isOpen && (
          <VerifyEmailContent
            key={prefilledEmail || "default"}
            email={prefilledEmail || ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
