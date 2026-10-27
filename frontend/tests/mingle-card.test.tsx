import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MingleCard } from "@/components/mingles/mingle-card";
import { Mingle } from "@/types/mingle";
import { PublicProfile } from "@/types/auth";

const mockMingle: Mingle = {
  id: "mingle-101",
  title: "Soho Craft Cocktail & Mixology Evening",
  description: "An intimate evening exploring artisanal gin cocktails.",
  experience_type: "cocktails",
  experience_type_display: "Cocktail Evening",
  event_date: "2026-11-20",
  start_time: "19:30:00",
  duration_minutes: 120,
  ticket_price: "42.00",
  capacity: 12,
  hero_image: null,
  status: "published",
  venue: {
    id: "venue-soho-1",
    name: "The Vault Lounge",
    slug: "the-vault-lounge",
    category: "Cocktail Bar",
    area: "Soho",
    address: "24 Dean Street",
    postcode: "W1D 3RR",
  },
  spots_remaining: 5,
  is_sold_out: false,
  confirmed_attendees_count: 7,
  age_min: 21,
  age_max: 35,
  created_at: "2026-10-01T12:00:00Z",
};

const mockAttendees: PublicProfile[] = [
  { id: "p1", display_name: "Charlotte Evans", photo: "https://example.com/c.jpg" },
  { id: "p2", display_name: "Liam Davies", photo: "https://example.com/l.jpg" },
];

describe("MingleCard Component", () => {
  it("renders title, category pill, and price in GBP", () => {
    render(<MingleCard mingle={mockMingle} attendees={mockAttendees} isVisitor={false} />);

    expect(screen.getByText("Soho Craft Cocktail & Mixology Evening")).toBeDefined();
    expect(screen.getByText("Cocktail Evening")).toBeDefined();
    expect(screen.getByText("£42")).toBeDefined();
  });

  it("renders venue and area metadata", () => {
    render(<MingleCard mingle={mockMingle} attendees={mockAttendees} isVisitor={false} />);

    expect(screen.getByText(/The Vault Lounge, Soho/i)).toBeDefined();
    expect(screen.getByText(/Ages 21–35/i)).toBeDefined();
  });

  it("renders remaining spots badge when places are available", () => {
    render(<MingleCard mingle={mockMingle} attendees={mockAttendees} isVisitor={false} />);

    expect(screen.getByText(/5 left/i)).toBeDefined();
  });

  it("renders 'Full' badge when mingle is sold out", () => {
    const soldOutMingle: Mingle = {
      ...mockMingle,
      spots_remaining: 0,
      is_sold_out: true,
    };
    render(<MingleCard mingle={soldOutMingle} attendees={mockAttendees} isVisitor={false} />);

    expect(screen.getByText("Full")).toBeDefined();
  });

  it("enforces Defect #3 fix: flags past event with 'Past Event' or 'Completed'", () => {
    const pastMingle: Mingle = {
      ...mockMingle,
      event_date: "2025-01-01",
    };
    render(<MingleCard mingle={pastMingle} attendees={mockAttendees} isVisitor={false} />);

    expect(screen.getAllByText(/Past Event|Completed/i).length).toBeGreaterThan(0);
  });

  it("renders blurred avatar slots for unauthenticated visitors without exposing attendee names", () => {
    const { container } = render(
      <MingleCard mingle={mockMingle} attendees={mockAttendees} isVisitor={true} />
    );

    // Charlotte Evans name should NOT be rendered on visitor card
    expect(screen.queryByText("Charlotte Evans")).toBeNull();
    // Blurred user icon placeholders exist
    const blurredIcons = container.querySelectorAll("svg.blur-\\[2px\\]");
    expect(blurredIcons.length).toBeGreaterThan(0);
  });
});
