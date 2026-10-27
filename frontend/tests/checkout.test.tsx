import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CheckoutPage from "@/app/checkout/[id]/page";
import { getMingle } from "@/lib/api/mingles";
import { createBooking, createCheckoutSession } from "@/lib/api/bookings";
import { useAuth } from "@/context/auth-context";
import { Mingle } from "@/types/mingle";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "mingle-chk-1" }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/mingles", () => ({
  getMingle: vi.fn(),
}));

vi.mock("@/lib/api/bookings", () => ({
  createBooking: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockUpcomingMingle: Mingle = {
  id: "mingle-chk-1",
  title: "Covent Garden Secret Wine Cellar Tasting",
  description: "An exclusive cellar wine tasting experience.",
  experience_type: "wine_tasting",
  experience_type_display: "Wine Tasting",
  event_date: "2026-12-15",
  start_time: "19:00:00",
  duration_minutes: 120,
  ticket_price: "45.00",
  capacity: 10,
  spots_remaining: 4,
  is_sold_out: false,
  confirmed_attendees_count: 6,
  age_min: 21,
  age_max: 38,
  hero_image: "https://example.com/cellar.jpg",
  status: "published",
  venue: {
    id: "venue-covent-1",
    name: "The Crypt Bar",
    slug: "the-crypt-bar",
    category: "Wine Bar",
    area: "Covent Garden",
    address: "12 Floral Street",
    postcode: "WC2E 9DH",
  },
  created_at: "2026-10-01T10:00:00Z",
};

describe("CheckoutPage Component (Part F4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      openModal: vi.fn(),
    });
  });

  it("renders experience details and default 1 place at £45.00", async () => {
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUpcomingMingle);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Covent Garden Secret Wine Cellar Tasting")).toBeDefined();
      expect(screen.getByText("The Crypt Bar, Covent Garden")).toBeDefined();
      expect(screen.getByTestId("places-count").textContent).toBe("1");
      expect(screen.getAllByText("£45.00").length).toBeGreaterThan(0);
    });
  });

  it("handles place increment and recalculates total price in GBP (£)", async () => {
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUpcomingMingle);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByTestId("places-count")).toBeDefined();
    });

    const plusBtn = screen.getByLabelText("Increase places");
    fireEvent.click(plusBtn);

    // 2 places @ £45 = £90.00
    expect(screen.getByTestId("places-count").textContent).toBe("2");
    expect(screen.getAllByText("£90.00").length).toBeGreaterThan(0);

    // Increase again to 3 places = £135.00
    fireEvent.click(plusBtn);
    expect(screen.getByTestId("places-count").textContent).toBe("3");
    expect(screen.getAllByText("£135.00").length).toBeGreaterThan(0);

    // Decrease back to 2 places
    const minusBtn = screen.getByLabelText("Decrease places");
    fireEvent.click(minusBtn);
    expect(screen.getByTestId("places-count").textContent).toBe("2");
    expect(screen.getAllByText("£90.00").length).toBeGreaterThan(0);
  });

  it("caps maximum places at available spots (spots_remaining = 4)", async () => {
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUpcomingMingle);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByTestId("places-count")).toBeDefined();
    });

    const plusBtn = screen.getByLabelText("Increase places") as HTMLButtonElement;
    // Click 5 times
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);

    // Should not exceed 4 places
    expect(screen.getByTestId("places-count").textContent).toBe("4");
    expect(plusBtn.disabled).toBe(true);
  });

  it("enforces Defect #3 fix: blocks past event with Registration Closed banner", async () => {
    const pastMingle: Mingle = {
      ...mockUpcomingMingle,
      event_date: "2025-01-01",
    };
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(pastMingle);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Registration Closed")).toBeDefined();
      expect(screen.getByText(/This experience took place in the past/i)).toBeDefined();
      expect(screen.getByText("Event Closed")).toBeDefined();
    });
  });

  it("prompts login modal when unauthenticated member attempts to book", async () => {
    const openModalMock = vi.fn();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      openModal: openModalMock,
    });
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUpcomingMingle);

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText("Sign In to Book Places")).toBeDefined();
    });

    const signInBtn = screen.getByText("Sign In to Book Places");
    fireEvent.click(signInBtn);

    expect(openModalMock).toHaveBeenCalledWith("login");
  });

  it("initiates booking and creates Stripe Checkout session on click", async () => {
    (getMingle as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUpcomingMingle);
    (createBooking as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      message: "Created",
      booking: { id: "booking-999" },
    });
    (createCheckoutSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      session_id: "cs_mock_123",
      checkout_url: "https://checkout.stripe.com/pay/cs_mock_123",
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Pay £45\.00/i })).toBeDefined();
    });

    const payBtn = screen.getByRole("button", { name: /Pay £45\.00/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(createBooking).toHaveBeenCalledWith({
        mingle_id: "mingle-chk-1",
        places_booked: 1,
      });
      expect(createCheckoutSession).toHaveBeenCalledWith(
        "booking-999",
        expect.objectContaining({
          success_url: expect.stringContaining("/bookings/booking-999/success"),
          cancel_url: expect.stringContaining("/bookings/booking-999/cancelled"),
        })
      );
    });
  });
});
