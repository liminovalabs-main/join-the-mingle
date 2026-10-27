import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { calcAgeGroup, calcAgeGroupFromDob, calcAge } from "@/lib/utils/age";
import { VerifiedBadge } from "@/components/profile/verified-badge";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { PrivateProfile } from "@/types/auth";

describe("Age Calculation & Base44 Demographic Grouping (UK GDPR)", () => {
  it("derives correct age brackets from DOB without exposing exact age", () => {
    const today = new Date();
    const twentyFiveYearsAgo = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
    const thirtyFiveYearsAgo = new Date(today.getFullYear() - 35, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
    const sixtyTwoYearsAgo = new Date(today.getFullYear() - 62, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];

    expect(calcAgeGroupFromDob(twentyFiveYearsAgo)).toBe("20s");
    expect(calcAgeGroupFromDob(thirtyFiveYearsAgo)).toBe("30s");
    expect(calcAgeGroupFromDob(sixtyTwoYearsAgo)).toBe("60+");
  });

  it("handles null and undefined DOB gracefully", () => {
    expect(calcAgeGroupFromDob(null)).toBe("");
    expect(calcAgeGroupFromDob(undefined)).toBe("");
    expect(calcAgeGroup(null)).toBe("");
  });
});

describe("VerifiedBadge Component", () => {
  it("renders verified check icon when verified is true", () => {
    render(<VerifiedBadge verified={true} />);
    const badge = screen.getByTitle(/Age verified/i);
    expect(badge).toBeInTheDocument();
  });

  it("renders nothing when verified is false or omitted", () => {
    const { container } = render(<VerifiedBadge verified={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ProfileSummaryCard Component (Base44 Fidelity)", () => {
  const mockProfile: PrivateProfile = {
    id: "profile-123",
    email: "sarah.jenkins@example.com",
    role: "member",
    is_email_verified: true,
    display_name: "Sarah Jenkins",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    gender: "Female",
    relationship_status: "Single",
    date_of_birth: "1995-04-12",
    age_group: "20s",
    is_age_verified: false,
    bio: "Architecture and contemporary art lover.",
    interests: ["Wine Tasting", "Jazz"],
    sound_enabled: true,
    notifications_enabled: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("renders the first name, avatar, and demographics", () => {
    render(<ProfileSummaryCard profile={mockProfile} />);
    expect(screen.getByText("Sarah")).toBeInTheDocument();
    expect(screen.getByText("20s")).toBeInTheDocument();
    expect(screen.getByText(/Female/i)).toBeInTheDocument();
    expect(screen.getByText(/Single/i)).toBeInTheDocument();
  });

  it("displays 'Age verification pending' when unverified", () => {
    render(<ProfileSummaryCard profile={mockProfile} />);
    expect(screen.getByText(/Age verification pending/i)).toBeInTheDocument();
  });

  it("renders verified checkmark when is_age_verified is true", () => {
    const verifiedProfile = { ...mockProfile, is_age_verified: true };
    render(<ProfileSummaryCard profile={verifiedProfile} />);
    expect(screen.getByTitle(/Age verified/i)).toBeInTheDocument();
    expect(screen.queryByText(/Age verification pending/i)).not.toBeInTheDocument();
  });

  it("renders 'Edit profile' button when onEdit is provided and triggers callback", () => {
    const onEditSpy = vi.fn();
    render(<ProfileSummaryCard profile={mockProfile} onEdit={onEditSpy} />);
    const editBtn = screen.getByRole("button", { name: /Edit profile/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(onEditSpy).toHaveBeenCalledTimes(1);
  });

  it("suppresses 'Edit profile' button when onEdit is undefined (Defect #2 Fix)", () => {
    render(<ProfileSummaryCard profile={mockProfile} onEdit={undefined} />);
    expect(screen.queryByRole("button", { name: /Edit profile/i })).not.toBeInTheDocument();
  });
});
