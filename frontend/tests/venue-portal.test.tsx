import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VenueRegistrationForm } from "@/components/venue/venue-registration-form";
import { VenueStatusBanner } from "@/components/venue/venue-status-banner";
import { VenueOperatingHoursEditor } from "@/components/venue/venue-operating-hours-editor";
import { MingleProposalForm } from "@/components/venue/mingle-proposal-form";
import { VenueMinglesList } from "@/components/venue/venue-mingles-list";
import { useAuth } from "@/hooks/use-auth";
import * as venuesApi from "@/lib/api/venues";
import * as minglesApi from "@/lib/api/mingles";
import { Mingle } from "@/types/mingle";
import { VenueOpeningHour } from "@/types/venue";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/venues", () => ({
  registerVenue: vi.fn(),
  updateVenueOpeningHours: vi.fn(),
}));

vi.mock("@/lib/api/mingles", () => ({
  submitMingleProposal: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("VenueRegistrationForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login and registration prompt when user is not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isMounted: true,
      role: "member",
      activeModal: null,
      prefilledEmail: "",
      openModal: vi.fn(),
      closeModal: vi.fn(),
      saveSession: vi.fn(),
      initiateSocialAuth: vi.fn(),
      handleSocialCallback: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      requestPasswordReset: vi.fn(),
      verifyPasswordResetCode: vi.fn(),
      confirmPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    });

    render(<VenueRegistrationForm />);

    expect(screen.getByText("Partner With Mingler")).toBeDefined();
    expect(screen.getByRole("button", { name: /Log In/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeDefined();
  });

  it("prompts email verification guard when user is authenticated but unverified", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u1",
        email: "test@example.com",
        role: "member",
        is_active: true,
        is_email_verified: false,
      },
      profile: null,
      tokens: null,
      isAuthenticated: true,
      isLoading: false,
      isMounted: true,
      role: "member",
      activeModal: null,
      prefilledEmail: "",
      openModal: vi.fn(),
      closeModal: vi.fn(),
      saveSession: vi.fn(),
      initiateSocialAuth: vi.fn(),
      handleSocialCallback: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      requestPasswordReset: vi.fn(),
      verifyPasswordResetCode: vi.fn(),
      confirmPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    });

    render(<VenueRegistrationForm />);

    expect(screen.getByText("Email Verification Required")).toBeDefined();
    expect(screen.getByRole("button", { name: /Verify Email Now/i })).toBeDefined();
  });

  it("renders form and submits registration when user is verified", async () => {
    const refreshProfile = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u1",
        email: "verified@example.com",
        role: "member",
        is_active: true,
        is_email_verified: true,
      },
      profile: null,
      tokens: null,
      isAuthenticated: true,
      isLoading: false,
      isMounted: true,
      role: "member",
      activeModal: null,
      prefilledEmail: "",
      openModal: vi.fn(),
      closeModal: vi.fn(),
      saveSession: vi.fn(),
      initiateSocialAuth: vi.fn(),
      handleSocialCallback: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      requestPasswordReset: vi.fn(),
      verifyPasswordResetCode: vi.fn(),
      confirmPasswordReset: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile,
      logout: vi.fn(),
    });

    vi.mocked(venuesApi.registerVenue).mockResolvedValue({
      id: "venue-123",
      name: "The Hackney Speakeasy",
      slug: "the-hackney-speakeasy",
      category: "Cocktail Bar",
      area: "Hackney",
      address: "10 Mare Street",
      postcode: "E8 4RT",
      description: "Chic speakeasy in East London",
      hero_image: null,
      status: "pending",
      average_rating: 5.0,
      review_count: 0,
      created_at: "2026-11-01T00:00:00Z",
    });

    render(<VenueRegistrationForm />);

    expect(screen.getByText("Register Your Venue")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText(/The Shoreditch Speakeasy/i), {
      target: { value: "The Hackney Speakeasy" },
    });
    fireEvent.change(screen.getByPlaceholderText(/14 Curtain Road/i), {
      target: { value: "10 Mare Street" },
    });
    fireEvent.change(screen.getByPlaceholderText(/EC2A 3HJ/i), {
      target: { value: "E8 4RT" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Submit Venue Application/i })
    );

    await waitFor(() => {
      expect(venuesApi.registerVenue).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Application Received!")).toBeDefined();
    });
  });
});

describe("VenueStatusBanner Component", () => {
  it("renders pending state correctly", () => {
    render(<VenueStatusBanner status="pending" venueName="Old Street Cellar" />);
    expect(screen.getByText("Under Curator Review")).toBeDefined();
    expect(screen.getByText(/Old Street Cellar is Pending/i)).toBeDefined();
  });

  it("renders approved state with live badge", () => {
    render(<VenueStatusBanner status="approved" venueName="Soho Velvet Lounge" />);
    expect(screen.getByText("Verified Partner")).toBeDefined();
    expect(screen.getByText(/Soho Velvet Lounge is Live/i)).toBeDefined();
  });

  it("renders rejected state with support notice", () => {
    render(<VenueStatusBanner status="rejected" venueName="Declined Club" />);
    expect(screen.getByText("Application Declined")).toBeDefined();
    expect(screen.getByText(/partners@mingler.co.uk/i)).toBeDefined();
  });
});

describe("VenueOperatingHoursEditor Component (Defect #8 Fix)", () => {
  const initialHours: VenueOpeningHour[] = [
    {
      id: "h-0",
      day_of_week: 0,
      day_name: "Monday",
      open_time: "17:00:00",
      close_time: "23:00:00",
      is_closed: false,
    },
    {
      id: "h-1",
      day_of_week: 1,
      day_name: "Tuesday",
      open_time: null,
      close_time: null,
      is_closed: true,
    },
  ];

  it("renders 7 days with time pickers and closed toggles", () => {
    render(
      <VenueOperatingHoursEditor
        venueId="venue-123"
        initialHours={initialHours}
      />
    );

    expect(screen.getByText("7-Day Operating Hours")).toBeDefined();
    expect(screen.getByText("Monday")).toBeDefined();
    expect(screen.getByText("Tuesday")).toBeDefined();
    expect(screen.getByText("Sunday")).toBeDefined();
    expect(screen.getByText("Closed all day")).toBeDefined();
  });

  it("saves updated schedule with validated HH:MM:SS format", async () => {
    vi.mocked(venuesApi.updateVenueOpeningHours).mockResolvedValue(initialHours);

    render(
      <VenueOperatingHoursEditor
        venueId="venue-123"
        initialHours={initialHours}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Save Schedule/i }));

    await waitFor(() => {
      expect(venuesApi.updateVenueOpeningHours).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(venuesApi.updateVenueOpeningHours).mock.calls[0][1];
      expect(callArg).toHaveLength(7);
      expect(callArg[0].day_of_week).toBe(0);
      expect(callArg[0].open_time).toBe("17:00:00");
    });
  });
});

describe("MingleProposalForm Component (Defect #3 Fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required title and bounds before submitting", async () => {
    render(
      <MingleProposalForm venueId="venue-123" venueName="The Shoreditch Den" />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Submit Experience for Approval/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Please provide an experience title.")
      ).toBeDefined();
      expect(minglesApi.submitMingleProposal).not.toHaveBeenCalled();
    });
  });

  it("submits proposal successfully when valid future data is provided", async () => {
    const onSuccess = vi.fn();
    const mockMingle: Mingle = {
      id: "mingle-new",
      title: "Saturday Mixology Masterclass",
      description: "Learn to craft 3 signature martinis.",
      experience_type: "cocktails",
      experience_type_display: "Cocktails",
      event_date: "2026-12-15",
      start_time: "19:00:00",
      duration_minutes: 120,
      ticket_price: "45.00",
      capacity: 10,
      spots_remaining: 10,
      is_sold_out: false,
      confirmed_attendees_count: 0,
      hero_image: null,
      status: "submitted",
      venue: {
        id: "venue-123",
        name: "The Shoreditch Den",
        slug: "the-shoreditch-den",
        category: "Cocktail Bar",
        area: "Shoreditch",
        address: "142 Shoreditch High St",
        postcode: "E1 6JE",
      },
      created_at: "2026-11-01T00:00:00Z",
    };

    vi.mocked(minglesApi.submitMingleProposal).mockResolvedValue(mockMingle);

    render(
      <MingleProposalForm
        venueId="venue-123"
        venueName="The Shoreditch Den"
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Candlelit Italian Feast/i),
      { target: { value: "Saturday Mixology Masterclass" } }
    );
    fireEvent.change(screen.getByLabelText(/Event Date/i), {
      target: { value: "2026-12-15" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Submit Experience for Approval/i })
    );

    await waitFor(() => {
      expect(minglesApi.submitMingleProposal).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(mockMingle);
    });
  });
});

describe("VenueMinglesList Component", () => {
  it("renders empty state when no mingles exist", () => {
    const onProposeClick = vi.fn();
    render(<VenueMinglesList mingles={[]} onProposeClick={onProposeClick} />);

    expect(screen.getByText("No Mingles Hosted Yet")).toBeDefined();
    const proposeBtn = screen.getByRole("button", {
      name: /Propose An Experience/i,
    });
    fireEvent.click(proposeBtn);
    expect(onProposeClick).toHaveBeenCalledTimes(1);
  });

  it("renders mingles with status badges and curator feedback notes", () => {
    const mockMingleWithNotes: Mingle = {
      id: "m-feedback",
      title: "Wine & Cheese Gathering",
      description: "Fine British cheeses paired with artisan wines.",
      experience_type: "wine_tasting",
      experience_type_display: "Wine Tasting",
      event_date: "2026-11-20",
      start_time: "18:30:00",
      duration_minutes: 120,
      ticket_price: "40.00",
      capacity: 8,
      spots_remaining: 8,
      is_sold_out: false,
      confirmed_attendees_count: 0,
      hero_image: null,
      status: "changes_requested",
      curator_notes: "Please include vegan cheese alternatives in description.",
      venue: {
        id: "v-1",
        name: "Mayfair Wine Cellar",
        slug: "mayfair-wine-cellar",
        category: "Wine Lounge",
        area: "Mayfair",
        address: "12 Berkeley Square",
        postcode: "W1J 6BQ",
      },
      created_at: "2026-11-01T00:00:00Z",
    };

    render(<VenueMinglesList mingles={[mockMingleWithNotes]} />);

    expect(screen.getByText("Wine & Cheese Gathering")).toBeDefined();
    expect(screen.getByText("Changes Requested")).toBeDefined();
    expect(screen.getByText("Curator Feedback from Mingler")).toBeDefined();
    expect(
      screen.getByText(/Please include vegan cheese alternatives in description/i)
    ).toBeDefined();
  });
});
