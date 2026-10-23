import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { AuthProvider } from "@/context/auth-context";

describe("ProfileEditor (Defect #6 Regex Validation & UK GDPR Verification)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "mingler_user",
      JSON.stringify({
        id: "1",
        email: "alex@mingler.co.uk",
        role: "member",
        is_active: true,
        is_email_verified: true,
      })
    );
    localStorage.setItem(
      "mingler_profile",
      JSON.stringify({
        id: "p1",
        email: "alex@mingler.co.uk",
        display_name: "Alex",
        role: "member",
        interests: ["Wine Tasting"],
      })
    );
  });

  it("verifies Defect #1 fix: avatar maintains aspect-square shrink-0 layout", () => {
    const { container } = render(
      <AuthProvider>
        <ProfileEditor />
      </AuthProvider>
    );

    const avatar = container.querySelector(".rounded-full.aspect-square");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("shrink-0");
  });

  it("enforces Defect #6 fix: rejects invalid Instagram handles", () => {
    render(
      <AuthProvider>
        <ProfileEditor />
      </AuthProvider>
    );

    const igInput = screen.getByPlaceholderText("username");
    fireEvent.change(igInput, { target: { value: "invalid handle with spaces!" } });

    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(
      screen.getByText(/valid handle letters, numbers, dots, and underscores/i)
    ).toBeInTheDocument();
  });

  it("enforces Defect #6 fix: rejects invalid LinkedIn URLs", () => {
    render(
      <AuthProvider>
        <ProfileEditor />
      </AuthProvider>
    );

    const liInput = screen.getByPlaceholderText("https://linkedin.com/in/alex");
    fireEvent.change(liInput, { target: { value: "https://twitter.com/not-linkedin" } });

    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(
      screen.getByText(/enter a valid profile url/i)
    ).toBeInTheDocument();
  });

  it("enforces 18+ age validation on Date of Birth", () => {
    render(
      <AuthProvider>
        <ProfileEditor />
      </AuthProvider>
    );

    // Pick a date that makes user under 18 (e.g. today minus 10 years)
    const recentYear = new Date().getFullYear() - 10;
    const underAgeDate = `${recentYear}-01-01`;

    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: underAgeDate } });

    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(
      screen.getByText(/you must be at least 18 years old to join mingler/i)
    ).toBeInTheDocument();
  });
});
