import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemberBookingsTab } from "@/components/bookings/member-bookings-tab";
import { getMyBookings, cancelBooking, downloadCalendarInvite } from "@/lib/api/bookings";
import { Booking } from "@/types/booking";
import { toast } from "sonner";

vi.mock("@/lib/api/bookings", () => ({
  getMyBookings: vi.fn(),
  cancelBooking: vi.fn(),
  downloadCalendarInvite: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockBookings: Booking[] = [
  {
    id: "b-upcoming-1",
    mingle: {
      id: "m-1",
      title: "Shoreditch Rooftop Supper Club",
      description: "An evening of artisanal dining in East London.",
      experience_type: "dinner",
      experience_type_display: "Dinner Party",
      event_date: "2026-11-25",
      start_time: "19:30:00",
      duration_minutes: 150,
      ticket_price: "55.00",
      capacity: 12,
      spots_remaining: 3,
      is_sold_out: false,
      confirmed_attendees_count: 9,
      age_min: 24,
      age_max: 38,
      hero_image: "https://example.com/supper.jpg",
      status: "published",
      venue: {
        id: "v-1",
        name: "Boundary Rooftop",
        slug: "boundary-rooftop",
        category: "Rooftop Restaurant",
        area: "Shoreditch",
        address: "2-4 Boundary Street",
        postcode: "E2 7DD",
      },
      created_at: "2026-10-01T10:00:00Z",
    },
    places_booked: 2,
    unit_price: "55.00",
    total_amount: "110.00",
    status: "confirmed",
    status_display: "Confirmed",
    created_at: "2026-10-10T12:00:00Z",
    updated_at: "2026-10-10T12:00:00Z",
  },
  {
    id: "b-past-1",
    mingle: {
      id: "m-2",
      title: "Soho Jazz & Gin Social",
      description: "Live jazz with gin pairing.",
      experience_type: "cocktails",
      experience_type_display: "Cocktail Evening",
      event_date: "2025-05-10",
      start_time: "20:00:00",
      duration_minutes: 120,
      ticket_price: "40.00",
      capacity: 15,
      spots_remaining: 0,
      is_sold_out: true,
      confirmed_attendees_count: 15,
      age_min: 21,
      age_max: 35,
      hero_image: null,
      status: "completed",
      venue: {
        id: "v-2",
        name: "Ronnie's Basement",
        slug: "ronnies-basement",
        category: "Jazz Bar",
        area: "Soho",
        address: "47 Frith Street",
        postcode: "W1D 4HT",
      },
      created_at: "2025-04-01T10:00:00Z",
    },
    places_booked: 1,
    unit_price: "40.00",
    total_amount: "40.00",
    status: "confirmed",
    status_display: "Confirmed",
    created_at: "2025-05-01T12:00:00Z",
    updated_at: "2025-05-01T12:00:00Z",
  },
];

describe("MemberBookingsTab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upcoming reservations with reference ID, places, total in GBP, and venue", async () => {
    (getMyBookings as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      count: 2,
      results: mockBookings,
    });

    render(<MemberBookingsTab />);

    await waitFor(() => {
      expect(screen.getByText("Shoreditch Rooftop Supper Club")).toBeDefined();
      expect(screen.getByText(/Boundary Rooftop, Shoreditch/i)).toBeDefined();
      expect(screen.getByText(/Ref: #B-UPCOMI/i)).toBeDefined();
      expect(screen.getByText(/2 seats booked/i)).toBeDefined();
      expect(screen.getByText("£110.00")).toBeDefined();
    });
  });

  it("handles instant RFC 5545 .ics calendar download", async () => {
    (getMyBookings as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      count: 2,
      results: mockBookings,
    });
    (downloadCalendarInvite as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    render(<MemberBookingsTab />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Calendar \(\.ics\)/i })).toBeDefined();
    });

    const calBtn = screen.getByRole("button", { name: /Calendar \(\.ics\)/i });
    fireEvent.click(calBtn);

    await waitFor(() => {
      expect(downloadCalendarInvite).toHaveBeenCalledWith(
        "b-upcoming-1",
        expect.stringContaining("mingle-m-1.ics")
      );
      expect(toast.success).toHaveBeenCalledWith("Calendar invitation downloaded!");
    });
  });

  it("opens cancellation modal and calls cancelBooking to release capacity", async () => {
    (getMyBookings as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        count: 2,
        results: mockBookings,
      })
      .mockResolvedValueOnce({
        count: 1,
        results: [mockBookings[1]], // only past remaining
      });

    (cancelBooking as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      message: "Cancelled",
      booking: { ...mockBookings[0], status: "cancelled" },
    });

    render(<MemberBookingsTab />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Cancel$/i })).toBeDefined();
    });

    const cancelBtn = screen.getByRole("button", { name: /^Cancel$/i });
    fireEvent.click(cancelBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Cancel Reservation\?/i)).toBeDefined();
      expect(
        screen.getByText(/Your 2 places will be immediately released to other members/i)
      ).toBeDefined();
    });

    // Provide reason and confirm
    const reasonInput = screen.getByPlaceholderText(/Schedule conflict, feeling unwell/i);
    fireEvent.change(reasonInput, { target: { value: "Work trip to Manchester" } });

    const confirmBtn = screen.getByRole("button", { name: /Yes, Cancel Reservation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(cancelBooking).toHaveBeenCalledWith("b-upcoming-1", "Work trip to Manchester");
      expect(toast.success).toHaveBeenCalledWith(
        "Reservation cancelled. Reserved capacity has been released."
      );
    });
  });

  it("renders empty state placeholder when member has zero reservations", async () => {
    (getMyBookings as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      count: 0,
      results: [],
    });

    render(<MemberBookingsTab />);

    await waitFor(() => {
      expect(screen.getByText("No Upcoming Reservations")).toBeDefined();
      expect(screen.getByText("Find Your Next Mingle")).toBeDefined();
    });
  });
});
