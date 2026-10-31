import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { VenueApprovalCard } from "@/components/admin/venue-approval-card";
import { MingleApprovalCard } from "@/components/admin/mingle-approval-card";
import { PlatformCommissionCard } from "@/components/admin/platform-commission-card";
import { useAuth } from "@/hooks/use-auth";
import * as adminApi from "@/lib/api/admin";
import { MingleApprovalItem, VenueApprovalItem } from "@/types/admin";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/admin", () => ({
  decideVenue: vi.fn(),
  decideMingle: vi.fn(),
  getCommissionSettings: vi.fn(),
  updateCommissionRate: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminGuard Component (Defect #9 Fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin users and displays 403 Forbidden Access Denied card", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u-member",
        email: "member@example.com",
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
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <AdminGuard>
        <div>Secret Admin Content</div>
      </AdminGuard>
    );

    expect(screen.getByText("403 Forbidden")).toBeDefined();
    expect(screen.getByText("Founder Admin Access Required")).toBeDefined();
    expect(screen.queryByText("Secret Admin Content")).toBeNull();
  });

  it("renders protected admin children when user has admin role", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "u-admin",
        email: "admin@mingler.co.uk",
        role: "admin",
        is_active: true,
        is_email_verified: true,
      },
      profile: null,
      tokens: null,
      isAuthenticated: true,
      isLoading: false,
      isMounted: true,
      role: "admin",
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

    render(
      <AdminGuard>
        <div>Secret Admin Content</div>
      </AdminGuard>
    );

    expect(screen.getByText("Secret Admin Content")).toBeDefined();
    expect(screen.queryByText("403 Forbidden")).toBeNull();
  });
});

describe("VenueApprovalCard Component", () => {
  const mockPendingVenue: VenueApprovalItem = {
    id: "v-pending-1",
    name: "Covent Garden Cellar",
    slug: "covent-garden-cellar",
    category: "Wine Lounge",
    area: "Covent Garden",
    address: "21 Floral Street",
    postcode: "WC2E 9DS",
    description: "Atmospheric historic brick cellar in central London.",
    hero_image: null,
    status: "pending",
    commission_rate: 10.0,
    manager_email: "manager@floralcellar.co.uk",
    manager_name: "Charlotte Evans",
    created_at: "2026-11-01T00:00:00Z",
  };

  it("renders applicant info and calls decideVenue with 'approve'", async () => {
    const onDecided = vi.fn();
    vi.mocked(adminApi.decideVenue).mockResolvedValue({
      ...mockPendingVenue,
      status: "approved",
    });

    render(
      <VenueApprovalCard venue={mockPendingVenue} onDecided={onDecided} />
    );

    expect(screen.getByText("Covent Garden Cellar")).toBeDefined();
    expect(screen.getByText(/manager@floralcellar.co.uk/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Approve Venue/i }));

    await waitFor(() => {
      expect(adminApi.decideVenue).toHaveBeenCalledWith("v-pending-1", "approve");
      expect(onDecided).toHaveBeenCalledWith("v-pending-1", "approve");
    });
  });

  it("calls decideVenue with 'reject' when rejected", async () => {
    const onDecided = vi.fn();
    vi.mocked(adminApi.decideVenue).mockResolvedValue({
      ...mockPendingVenue,
      status: "rejected",
    });

    render(
      <VenueApprovalCard venue={mockPendingVenue} onDecided={onDecided} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

    await waitFor(() => {
      expect(adminApi.decideVenue).toHaveBeenCalledWith("v-pending-1", "reject");
      expect(onDecided).toHaveBeenCalledWith("v-pending-1", "reject");
    });
  });
});

describe("MingleApprovalCard Component", () => {
  const mockPendingMingle: MingleApprovalItem = {
    id: "m-pending-1",
    venue: "v-1",
    venue_name: "Covent Garden Cellar",
    venue_area: "Covent Garden",
    title: "Old World Wine Flight",
    description: "Sample rare vintages from Bordeaux and Tuscany.",
    experience_type: "wine_tasting",
    event_date: "2026-11-28",
    start_time: "19:00:00",
    duration_minutes: 120,
    ticket_price: "42.00",
    capacity: 12,
    age_min: 24,
    age_max: 45,
    hero_image: null,
    status: "submitted",
    created_at: "2026-11-01T00:00:00Z",
  };

  it("renders proposal details and allows approving directly", async () => {
    const onDecided = vi.fn();
    vi.mocked(adminApi.decideMingle).mockResolvedValue({
      ...mockPendingMingle,
      status: "approved",
    });

    render(
      <MingleApprovalCard mingle={mockPendingMingle} onDecided={onDecided} />
    );

    expect(screen.getByText("Old World Wine Flight")).toBeDefined();
    expect(screen.getByText(/Covent Garden Cellar/i)).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: /Approve & Publish Live/i })
    );

    await waitFor(() => {
      expect(adminApi.decideMingle).toHaveBeenCalledWith(
        "m-pending-1",
        "approve"
      );
      expect(onDecided).toHaveBeenCalledWith("m-pending-1", "approve");
    });
  });

  it("opens modal and submits curator feedback notes on Request Changes", async () => {
    const onDecided = vi.fn();
    vi.mocked(adminApi.decideMingle).mockResolvedValue({
      ...mockPendingMingle,
      status: "changes_requested",
      curator_notes: "Please add charcuterie board to description.",
    });

    render(
      <MingleApprovalCard mingle={mockPendingMingle} onDecided={onDecided} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Request Changes/i }));

    expect(screen.getByText("Request Changes from Venue")).toBeDefined();

    fireEvent.change(
      screen.getByPlaceholderText(/Please update ticket price/i),
      { target: { value: "Please add charcuterie board to description." } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Send Notes to Venue/i })
    );

    await waitFor(() => {
      expect(adminApi.decideMingle).toHaveBeenCalledWith(
        "m-pending-1",
        "changes_requested",
        "Please add charcuterie board to description."
      );
      expect(onDecided).toHaveBeenCalledWith(
        "m-pending-1",
        "changes_requested"
      );
    });
  });
});

describe("PlatformCommissionCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders current commission and handles rate updates", async () => {
    vi.mocked(adminApi.getCommissionSettings).mockResolvedValue({
      success: true,
      commission_rate: 10.0,
      history: [
        {
          id: "hist-1",
          key: "commission_rate",
          value: 10.0,
          notes: "Platform baseline",
          updated_by_email: "founder@mingler.co.uk",
          created_at: "2026-10-01T00:00:00Z",
        },
      ],
    });

    vi.mocked(adminApi.updateCommissionRate).mockResolvedValue({
      success: true,
      message: "Commission updated to 12.5%",
      setting: {
        id: "hist-2",
        key: "commission_rate",
        value: 12.5,
        notes: "Holiday margin",
        updated_by_email: "founder@mingler.co.uk",
        created_at: "2026-11-01T00:00:00Z",
      },
    });

    render(<PlatformCommissionCard />);

    await waitFor(() => {
      expect(screen.getByText("Default Commission Rate")).toBeDefined();
      expect(screen.getAllByText(/10\.0%/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Platform baseline")).toBeDefined();
    });

    fireEvent.change(screen.getByDisplayValue("10"), {
      target: { value: "12.5" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Q4 holiday season/i),
      { target: { value: "Holiday margin" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Apply Commission Rate/i })
    );

    await waitFor(() => {
      expect(adminApi.updateCommissionRate).toHaveBeenCalledWith(
        12.5,
        "Holiday margin"
      );
    });
  });
});
