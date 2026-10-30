import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MingleReviewStep } from "@/components/interactions/mingle-review-step";
import { AttendeeReviewCard } from "@/components/interactions/attendee-review-card";
import { MingleAgainChoices } from "@/components/interactions/mingle-again-choices";
import { MemberConnectionsTab } from "@/components/interactions/member-connections-tab";
import { PublicProfile } from "@/types/auth";
import { Connection } from "@/lib/api/interactions";
import * as interactionsApi from "@/lib/api/interactions";

vi.mock("@/lib/api/interactions", async () => {
  const actual = await vi.importActual<typeof interactionsApi>("@/lib/api/interactions");
  return {
    ...actual,
    getMyConnections: vi.fn(),
  };
});

const mockAttendee1: PublicProfile = {
  id: "profile-attendee-1",
  display_name: "Sarah Jenkins",
  photo: "https://example.com/sarah.jpg",
  gender: "Female",
  relationship_status: "Single",
  bio: "Designer from Hackney",
  interests: ["Design", "Cocktails"],
  instagram_handle: "sarah_j",
  linkedin_url: "https://linkedin.com/in/sarahjenkins",
  is_age_verified: true,
  created_at: "2026-09-01T10:00:00Z",
};

const mockAttendee2: PublicProfile = {
  id: "profile-attendee-2",
  display_name: "James Thorne",
  photo: "",
  gender: "Male",
  relationship_status: "Single",
  bio: "Architect based in Islington",
  interests: ["Architecture", "Wine"],
  instagram_handle: "",
  linkedin_url: "",
  is_age_verified: true,
  created_at: "2026-09-02T11:00:00Z",
};

const mockConnections: Connection[] = [
  {
    id: "conn-123",
    mingle_id: "mingle-soho-1",
    mingle_title: "Secret Cellar Wine Tasting",
    mingle_date: "2026-10-25",
    matched_profile: mockAttendee1,
    is_celebrated: true,
    created_at: "2026-10-26T12:00:00Z",
  },
];

describe("MingleReviewStep Component", () => {
  it("renders venue and overall experience rating cards", () => {
    const handleChange = vi.fn();
    render(
      <MingleReviewStep
        venueRating={0}
        venueComment=""
        experienceRating={0}
        experienceComment=""
        onChange={handleChange}
      />
    );

    expect(screen.getByText("How was your Mingle?")).toBeDefined();
    expect(screen.getByText("The venue")).toBeDefined();
    expect(screen.getByText("Overall experience")).toBeDefined();
  });

  it("calls onChange when rating stars or comment textareas are updated", () => {
    const handleChange = vi.fn();
    render(
      <MingleReviewStep
        venueRating={4}
        venueComment="Great atmosphere"
        experienceRating={5}
        experienceComment="Had an amazing time"
        onChange={handleChange}
      />
    );

    const starButtons = screen.getAllByRole("button", { name: /5 out of 5 stars/i });
    expect(starButtons.length).toBe(2);

    // Click 5th star for the venue rating
    fireEvent.click(starButtons[0]);
    expect(handleChange).toHaveBeenCalledWith({ venueRating: 5 });

    // Enter text in the venue comment textarea
    const textareas = screen.getAllByPlaceholderText("A short note…");
    expect(textareas.length).toBe(2);

    fireEvent.change(textareas[0], { target: { value: "Lovely lighting!" } });
    expect(handleChange).toHaveBeenCalledWith({ venueComment: "Lovely lighting!" });
  });
});

describe("AttendeeReviewCard Component", () => {
  it("renders attendee name, avatar fallback, and report concern trigger", () => {
    const handleToggle = vi.fn();
    render(
      <AttendeeReviewCard
        profile={mockAttendee1}
        isSelected={false}
        onToggle={handleToggle}
        mingleId="mingle-soho-1"
      />
    );

    expect(screen.getByText("Sarah")).toBeDefined();
    expect(screen.getByText("I'd mingle with them again")).toBeDefined();
    expect(screen.getByText("Report a concern")).toBeDefined();
  });

  it("renders selected state and triggers onToggle callback on click", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <AttendeeReviewCard
        profile={mockAttendee1}
        isSelected={false}
        onToggle={handleToggle}
        mingleId="mingle-soho-1"
      />
    );

    const toggleButton = screen.getByRole("button", { name: /I'd mingle with them again/i });
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledWith(true);

    rerender(
      <AttendeeReviewCard
        profile={mockAttendee1}
        isSelected={true}
        onToggle={handleToggle}
        mingleId="mingle-soho-1"
      />
    );

    expect(screen.getByText("You'd mingle with them again")).toBeDefined();
  });
});

describe("MingleAgainChoices Component", () => {
  it("renders empty state message when no other attendees attended", () => {
    render(
      <MingleAgainChoices
        attendees={[]}
        selectedProfileIds={[]}
        onToggleProfile={vi.fn()}
        mingleId="mingle-soho-1"
      />
    );

    expect(screen.getByText("No other Minglers came to this one.")).toBeDefined();
  });

  it("renders a list of attendee cards for all fellow attendees", () => {
    render(
      <MingleAgainChoices
        attendees={[mockAttendee1, mockAttendee2]}
        selectedProfileIds={["profile-attendee-1"]}
        onToggleProfile={vi.fn()}
        mingleId="mingle-soho-1"
      />
    );

    expect(screen.getByText("Sarah")).toBeDefined();
    expect(screen.getByText("James")).toBeDefined();
    expect(screen.getByText("You'd mingle with them again")).toBeDefined();
    expect(screen.getByText("I'd mingle with them again")).toBeDefined();
  });
});

describe("MemberConnectionsTab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when user has no mutual connections", async () => {
    vi.mocked(interactionsApi.getMyConnections).mockResolvedValueOnce([]);

    render(<MemberConnectionsTab />);

    await waitFor(() => {
      expect(screen.getByText("No connections yet")).toBeDefined();
    });
    expect(screen.getByText("Browse Upcoming Mingles")).toBeDefined();
  });

  it("renders confirmed mutual connections with social links and mingle reference", async () => {
    vi.mocked(interactionsApi.getMyConnections).mockResolvedValueOnce(mockConnections);

    render(<MemberConnectionsTab />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    });

    expect(screen.getByText("Mutual Match")).toBeDefined();
    expect(screen.getByText("Secret Cellar Wine Tasting")).toBeDefined();
    expect(screen.getByText("@sarah_j")).toBeDefined();
    expect(screen.getByText("LinkedIn")).toBeDefined();
    expect(screen.getByText("View Profile")).toBeDefined();
  });
});
