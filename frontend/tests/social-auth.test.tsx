import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
} from "@/components/ui/social-icons";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { apiClient } from "@/lib/api/client";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ provider: "google" }),
  useSearchParams: () => new URLSearchParams("code=mock_auth_code_123&state=csrf_test_state"),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("OAuth2 Social Icons", () => {
  it("renders all 6 social provider SVG icons with custom classNames", () => {
    const { container } = render(
      <div>
        <GoogleIcon className="custom-google" />
        <AppleIcon className="custom-apple" />
        <FacebookIcon className="custom-facebook" />
        <InstagramIcon className="custom-instagram" />
        <TikTokIcon className="custom-tiktok" />
        <LinkedinIcon className="custom-linkedin" />
      </div>
    );

    expect(container.querySelector(".custom-google")).toBeInTheDocument();
    expect(container.querySelector(".custom-apple")).toBeInTheDocument();
    expect(container.querySelector(".custom-facebook")).toBeInTheDocument();
    expect(container.querySelector(".custom-instagram")).toBeInTheDocument();
    expect(container.querySelector(".custom-tiktok")).toBeInTheDocument();
    expect(container.querySelector(".custom-linkedin")).toBeInTheDocument();
  });
});

describe("SocialAuthButtons Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders login mode labels (Continue with Google / Apple)", () => {
    render(
      <AuthProvider>
        <SocialAuthButtons mode="login" />
      </AuthProvider>
    );

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more social accounts/i })).toBeInTheDocument();
  });

  it("renders register mode labels (Sign up with Google / Apple)", () => {
    render(
      <AuthProvider>
        <SocialAuthButtons mode="register" />
      </AuthProvider>
    );

    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up with apple/i })).toBeInTheDocument();
  });

  it("expands secondary providers (Facebook, Instagram, TikTok, LinkedIn) when toggle is clicked", () => {
    render(
      <AuthProvider>
        <SocialAuthButtons mode="login" />
      </AuthProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: /more social accounts/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole("button", { name: /continue with facebook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with tiktok/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with linkedin/i })).toBeInTheDocument();
  });

  it("calls API endpoint /auth/social/url/ when a provider is selected", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: {
        success: true,
        provider: "google",
        authorization_url: "https://accounts.google.com/o/oauth2/auth?test=1",
      },
    });

    render(
      <AuthProvider>
        <SocialAuthButtons mode="login" />
      </AuthProvider>
    );

    const googleBtn = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        "/auth/social/url/",
        expect.objectContaining({
          params: expect.objectContaining({
            provider: "google",
          }),
        })
      );
    });
  });
});

describe("AuthContext Social Authentication Methods", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function SocialTestConsumer() {
    const { handleSocialCallback, isAuthenticated, user } = useAuth();
    return (
      <div>
        <div data-testid="auth-status">{isAuthenticated ? "auth" : "anon"}</div>
        <div data-testid="user-email">{user?.email || "none"}</div>
        <button
          onClick={() => handleSocialCallback("google", "test_auth_code_xyz")}
        >
          Exchange Code
        </button>
      </div>
    );
  }

  it("exchanges authorization code and saves session", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        success: true,
        is_new_user: false,
        tokens: {
          access: "jwt-access-social",
          refresh: "jwt-refresh-social",
        },
        user: {
          id: "u-social-123",
          email: "social.member@gmail.com",
          role: "member",
          is_active: true,
          is_email_verified: true,
        },
        profile: {
          id: "p-social-123",
          email: "social.member@gmail.com",
          display_name: "Social Member",
          role: "member",
          is_email_verified: true,
          is_age_verified: true,
          sound_enabled: true,
          notifications_enabled: true,
          created_at: "2026-10-23T00:00:00Z",
          updated_at: "2026-10-23T00:00:00Z",
        },
      },
    });

    render(
      <AuthProvider>
        <SocialTestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-status").textContent).toBe("anon");

    const exchangeBtn = screen.getByRole("button", { name: /exchange code/i });
    fireEvent.click(exchangeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("auth");
      expect(screen.getByTestId("user-email").textContent).toBe("social.member@gmail.com");
      expect(localStorage.getItem("mingler_access_token")).toBe("jwt-access-social");
    });
  });
});
