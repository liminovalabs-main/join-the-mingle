"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, isLoading, openModal } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-coral" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-navy/60">
            Verifying Admin Permissions...
          </p>
        </div>
      </main>
    );
  }

  // Non-admin or unauthenticated access guard (Defect #9 Fix)
  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 sm:p-10 border border-brand-navy/10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full">
              403 Forbidden
            </span>
            <h1 className="text-2xl font-bold font-serif text-brand-navy">
              Founder Admin Access Required
            </h1>
            <p className="text-xs text-brand-navy/70 leading-relaxed">
              This area is restricted to Mingler platform founders and curation administrators.
              {user ? (
                <>
                  {" "}
                  Your current account (<span className="font-semibold text-brand-navy">{user.email}</span>)
                  has the role <span className="font-semibold text-brand-coral">{user.role}</span>.
                </>
              ) : (
                " Please sign in with administrator credentials."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {!isAuthenticated ? (
              <Button
                type="button"
                onClick={() => openModal("login")}
                className="w-full rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold uppercase tracking-wider text-xs py-5 shadow-lg shadow-brand-coral/20"
              >
                Sign In as Admin
              </Button>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-brand-navy/20 bg-white hover:bg-brand-navy/5 text-brand-navy font-bold uppercase tracking-wider text-xs py-3.5 transition-colors"
            >
              Return to Mingler Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
