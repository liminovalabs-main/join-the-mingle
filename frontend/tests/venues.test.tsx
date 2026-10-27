import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VenueCard } from "@/components/venues/venue-card";
import { VenueReviewList } from "@/components/venues/venue-review-list";
import { VenueReviewForm } from "@/components/venues/venue-review-form";
import { Venue, VenueReview } from "@/types/venue";
import { submitVenueReview } from "@/lib/api/venues";
import { toast } from "sonner";

vi.mock("@/lib/api/venues", () => ({
  submitVenueReview: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockVenue: Venue = {
  id: "venue-shoreditch-1",
  name: "The Rooftop Botanical Bar",
  slug: "the-rooftop-botanical-bar",
  category: "Cocktail Bar",
  area: "Shoreditch",
  address: "142 Shoreditch High Street",
  postcode: "E1 6JE",
  description: "A chic greenhouse-style botanical bar overlooking East London.",
  hero_image: "https://example.com/botanical.jpg",
  status: "approved",
  average_rating: 4.8,
  review_count: 14,
  created_at: "2026-09-01T10:00:00Z",
};

const mockReviews: VenueReview[] = [
  {
    id: "review-1",
    author_name: "Oliver Smith",
    rating: 5,
    comment: "Stunning venue and incredible atmosphere for our cocktail mingle!",
    created_at: "2026-10-15T18:00:00Z",
  },
  {
    id: "review-2",
    author_name: "Emma Watson",
    rating: 4,
    comment: "Great drinks, lovely view, but slightly crowded near the entrance.",
    created_at: "2026-10-20T20:30:00Z",
  },
];

describe("VenueCard Component", () => {
  it("renders venue name, category, and area metadata", () => {
    render(<VenueCard venue={mockVenue} />);

    expect(screen.getByText("The Rooftop Botanical Bar")).toBeDefined();
    expect(screen.getByText("Cocktail Bar")).toBeDefined();
    expect(screen.getByText("Shoreditch")).toBeDefined();
    expect(screen.getByText(/142 Shoreditch High Street/i)).toBeDefined();
  });

  it("displays average rating and review count", () => {
    render(<VenueCard venue={mockVenue} />);

    expect(screen.getByText(/4\.8 \(14\)/)).toBeDefined();
  });
});

describe("VenueReviewList Component (Defect #7 3NF Reviews)", () => {
  it("renders empty state placeholder when no reviews exist", () => {
    render(<VenueReviewList reviews={[]} emptyText="No reviews yet" />);

    expect(screen.getByText("No reviews yet")).toBeDefined();
  });

  it("renders reviews with author names, comments, and star ratings", () => {
    render(<VenueReviewList reviews={mockReviews} />);

    expect(screen.getByText("Oliver Smith")).toBeDefined();
    expect(
      screen.getByText("Stunning venue and incredible atmosphere for our cocktail mingle!")
    ).toBeDefined();

    expect(screen.getByText("Emma Watson")).toBeDefined();
    expect(
      screen.getByText("Great drinks, lovely view, but slightly crowded near the entrance.")
    ).toBeDefined();
  });
});

describe("VenueReviewForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders review prompt and comment input", () => {
    render(<VenueReviewForm venueSlugOrId="venue-shoreditch-1" />);

    expect(
      screen.getByText(/You mingled here/i)
    ).toBeDefined();
    expect(
      screen.getByPlaceholderText(/What made this venue special\?/i)
    ).toBeDefined();
  });

  it("submits valid review with comment and triggers onSaved callback", async () => {
    const onSaved = vi.fn();
    (submitVenueReview as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "rev-new",
      author_name: "Test User",
      rating: 5,
      comment: "Superb venue, loved the drinks!",
      created_at: "2026-10-27T08:00:00Z",
    });

    render(<VenueReviewForm venueSlugOrId="the-rooftop-botanical-bar" onSaved={onSaved} />);

    const textarea = screen.getByPlaceholderText(/What made this venue special\?/i);
    fireEvent.change(textarea, { target: { value: "Superb venue, loved the drinks!" } });

    const submitBtn = screen.getByRole("button", { name: /Post Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitVenueReview).toHaveBeenCalledWith("the-rooftop-botanical-bar", {
        rating: 5,
        comment: "Superb venue, loved the drinks!",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Thank you! Your venue review has been posted."
      );
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("handles API failure gracefully and displays toast error", async () => {
    (submitVenueReview as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network failure")
    );

    render(<VenueReviewForm venueSlugOrId="the-rooftop-botanical-bar" />);

    const textarea = screen.getByPlaceholderText(/What made this venue special\?/i);
    fireEvent.change(textarea, { target: { value: "Nice place!" } });

    const submitBtn = screen.getByRole("button", { name: /Post Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitVenueReview).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "An unexpected error occurred. Please try again."
      );
    });
  });
});
