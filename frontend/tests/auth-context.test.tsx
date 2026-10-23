import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api/client";

function TestConsumer() {
  const {
    isAuthenticated,
    user,
    activeModal,
    prefilledEmail,
    openModal,
    closeModal,
    confirmPasswordReset,
  } = useAuth();

  return (
    <div>
      <div data-testid="is-authenticated">
        {isAuthenticated ? "authenticated" : "anonymous"}
      </div>
      <div data-testid="user-email">{user?.email || "none"}</div>
      <div data-testid="active-modal">{activeModal || "none"}</div>
      <div data-testid="prefilled-email">{prefilledEmail || "none"}</div>
      <button onClick={() => openModal("login", "test@domain.co.uk")}>
        Open Login
      </button>
      <button onClick={() => openModal("register")}>Open Register</button>
      <button onClick={closeModal}>Close Modal</button>
      <button
        onClick={() =>
          confirmPasswordReset(
            "test@domain.co.uk",
            "123456",
            "NewPassword123!",
            "NewPassword123!"
          )
        }
      >
        Reset Password Action
      </button>
    </div>
  );
}

describe("AuthContext & State Machine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("provides anonymous initial state when storage is empty", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("is-authenticated").textContent).toBe("anonymous");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
    expect(screen.getByTestId("active-modal").textContent).toBe("none");
  });

  it("opens and closes modals while capturing prefilled email", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Open Login").click();
    });

    expect(screen.getByTestId("active-modal").textContent).toBe("login");
    expect(screen.getByTestId("prefilled-email").textContent).toBe("test@domain.co.uk");

    act(() => {
      screen.getByText("Close Modal").click();
    });

    expect(screen.getByTestId("active-modal").textContent).toBe("none");
  });

  it("hydrates authenticated state from localStorage if valid session is present", () => {
    localStorage.setItem("mingler_access_token", "fake-jwt-access");
    localStorage.setItem("mingler_refresh_token", "fake-jwt-refresh");
    localStorage.setItem(
      "mingler_user",
      JSON.stringify({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "alex@mingler.co.uk",
        role: "member",
        is_active: true,
        is_email_verified: true,
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("is-authenticated").textContent).toBe("authenticated");
    expect(screen.getByTestId("user-email").textContent).toBe("alex@mingler.co.uk");
  });

  it("clears user session and opens login modal on 'mingler:auth:expired' event", () => {
    localStorage.setItem("mingler_access_token", "token-to-expire");
    localStorage.setItem("mingler_refresh_token", "refresh-to-expire");
    localStorage.setItem(
      "mingler_user",
      JSON.stringify({
        id: "123",
        email: "expired@mingler.co.uk",
        role: "member",
        is_active: true,
        is_email_verified: true,
      })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("is-authenticated").textContent).toBe("authenticated");

    act(() => {
      window.dispatchEvent(new Event("mingler:auth:expired"));
    });

    expect(screen.getByTestId("is-authenticated").textContent).toBe("anonymous");
    expect(screen.getByTestId("active-modal").textContent).toBe("login");
  });

  it("submits correct new_password and new_password_confirm payload when confirming password reset", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: { success: true, message: "Password reset successfully." },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Reset Password Action").click();
    });

    expect(postSpy).toHaveBeenCalledWith("/auth/password-reset/confirm/", {
      email: "test@domain.co.uk",
      code: "123456",
      new_password: "NewPassword123!",
      new_password_confirm: "NewPassword123!",
      password: "NewPassword123!",
      password_confirm: "NewPassword123!",
    });

    // Successfully transitioned to login modal with prefilled email
    expect(screen.getByTestId("active-modal").textContent).toBe("login");
    expect(screen.getByTestId("prefilled-email").textContent).toBe(
      "test@domain.co.uk"
    );

    postSpy.mockRestore();
  });
});

