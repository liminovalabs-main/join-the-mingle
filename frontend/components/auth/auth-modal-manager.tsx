"use client";

import * as React from "react";
import { LoginModal } from "./login-modal";
import { RegisterModal } from "./register-modal";
import { VerifyEmailModal } from "./verify-email-modal";
import { ForgotPasswordModal } from "./forgot-password-modal";

export function AuthModalManager() {
  return (
    <>
      <LoginModal />
      <RegisterModal />
      <VerifyEmailModal />
      <ForgotPasswordModal />
    </>
  );
}
