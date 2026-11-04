import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import confetti from "canvas-confetti";
import { ConnectionCelebration } from "@/components/interactions/connection-celebration";
import { PublicProfile } from "@/types/auth";
import * as chimeUtils from "@/lib/utils/chime";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/utils/chime", () => ({
  playConnectionChime: vi.fn().mockResolvedValue(true),
  prefersReducedMotion: vi.fn().mockReturnValue(false),
}));

const mockMatchedProfile1: PublicProfile = {
  id: "profile-match-1",
  display_name: "Elena Rostova",
  photo: "https://example.com/elena.jpg",
  gender: "Female",
  relationship_status: "Single",
  bio: "Foodie & jazz lover",
  interests: ["Jazz", "Food"],
  instagram_handle: "elena_r",
  linkedin_url: "",
  is_age_verified: true,
  created_at: "2026-09-05T10:00:00Z",
};

const mockMatchedProfile2: PublicProfile = {
  id: "profile-match-2",
  display_name: "Marcus Vance",
  photo: "",
  gender: "Male",
  relationship_status: "Single",
  bio: "Photographer based in Soho",
  interests: ["Photography", "Cocktails"],
  instagram_handle: "marcus_v",
  linkedin_url: "",
  is_age_verified: true,
  created_at: "2026-09-06T12:00:00Z",
};

describe("ConnectionCelebration Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fires celebratory confetti and plays audio chime on mount", () => {
    render(
      <ConnectionCelebration
        matchedProfiles={[mockMatchedProfile1]}
        soundEnabled={true}
        onDismiss={vi.fn()}
      />
    );

    expect(confetti).toHaveBeenCalled();
    expect(chimeUtils.playConnectionChime).toHaveBeenCalled();
  });

  it("displays headline with matched member's first name for a single match", () => {
    render(
      <ConnectionCelebration
        matchedProfiles={[mockMatchedProfile1]}
        soundEnabled={true}
        onDismiss={vi.fn()}
      />
    );

    expect(
      screen.getByText("You and Elena would like to mingle again!")
    ).toBeDefined();
    expect(screen.getByText(/View connections/i)).toBeDefined();
    expect(screen.getByText("Nice!")).toBeDefined();
  });

  it("displays plural headline when multiple mutual matches occur simultaneously", () => {
    render(
      <ConnectionCelebration
        matchedProfiles={[mockMatchedProfile1, mockMatchedProfile2]}
        soundEnabled={true}
        onDismiss={vi.fn()}
      />
    );

    expect(
      screen.getByText(/You and 2 minglers would like to mingle again!/i)
    ).toBeDefined();
  });

  it("calls onDismiss when 'Nice!' button is clicked", () => {
    const handleDismiss = vi.fn();
    render(
      <ConnectionCelebration
        matchedProfiles={[mockMatchedProfile1]}
        soundEnabled={true}
        onDismiss={handleDismiss}
      />
    );

    const niceBtn = screen.getByRole("button", { name: "Nice!" });
    fireEvent.click(niceBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not play audio chime when soundEnabled is false", () => {
    render(
      <ConnectionCelebration
        matchedProfiles={[mockMatchedProfile1]}
        soundEnabled={false}
        onDismiss={vi.fn()}
      />
    );

    expect(chimeUtils.playConnectionChime).not.toHaveBeenCalled();
  });
});
