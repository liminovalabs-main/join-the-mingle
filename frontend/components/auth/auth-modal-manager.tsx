"use client";

import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { LoginModal } from "./login-modal";
import { RegisterModal } from "./register-modal";
import { VerifyEmailModal } from "./verify-email-modal";
import { ForgotPasswordModal } from "./forgot-password-modal";

const emptySubscribe = () => () => {};

export function AuthModalManager() {
  const { activeModal } = useAuth();

  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted || !activeModal) return null;

  return (
    <>
      {activeModal === "login" && <LoginModal />}
      {activeModal === "register" && <RegisterModal />}
      {activeModal === "verify-email" && <VerifyEmailModal />}
      {activeModal === "forgot-password" && <ForgotPasswordModal />}
    </>
  );
}
