import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttendeesSection } from "@/components/mingles/attendees-section";
import { PublicProfile } from "@/types/auth";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    openModal: vi.fn(),
  }),
}));

const mockAttendees: PublicProfile[] = [
  {
    id: "p1",
    display_name: "Sophia Clarke",
    photo: "https://example.com/sophia.jpg",
    gender: "Female",
    interests: ["Wine Tasting", "Modern Art"],
  },
  {
    id: "p2",
    display_name: "Oliver Wright",
    gender: "Male",
    interests: ["Mixology"],
  },
];

describe("AttendeesSection Component (Defect #5 & UK GDPR Compliance)", () => {
  it("renders confirmed attendee names and interests for authenticated members", () => {
    render(
      <AttendeesSection
        count={2}
        attendees={mockAttendees}
        isVisitor={false}
      />
    );

    expect(screen.getByText("Sophia Clarke")).toBeDefined();
    expect(screen.getByText("Oliver Wright")).toBeDefined();
    expect(screen.getByText(/Wine Tasting/i)).toBeDefined();
  });

  it("strictly enforces UK GDPR Defect #5 fix: never exposes email or date_of_birth", () => {
    const rawData = {
      ...mockAttendees[0],
      email: "secret@example.com",
      date_of_birth: "1995-05-12",
    } as PublicProfile & { email?: string; date_of_birth?: string };

    render(
      <AttendeesSection
        count={1}
        attendees={[rawData]}
        isVisitor={false}
      />
    );

    expect(screen.queryByText("secret@example.com")).toBeNull();
    expect(screen.queryByText("1995-05-12")).toBeNull();
  });

  it("renders visitor account prompt and blurred cards when unauthenticated", () => {
    const onPromptAuth = vi.fn();
    render(
      <AttendeesSection
        count={3}
        attendees={mockAttendees}
        isVisitor={true}
        onPromptAuth={onPromptAuth}
      />
    );

    expect(screen.getByText(/Want to see who is going\?/i)).toBeDefined();
    const signinButton = screen.getByText(/Sign in to view/i);
    expect(signinButton).toBeDefined();

    fireEvent.click(signinButton);
    expect(onPromptAuth).toHaveBeenCalledTimes(1);
  });

  it("renders empty state message when no attendees have joined yet", () => {
    render(
      <AttendeesSection
        count={0}
        attendees={[]}
        isVisitor={false}
      />
    );

    expect(screen.getByText(/No one has joined yet. Take the first spot!/i)).toBeDefined();
  });
});
