import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AboutPage from "@/app/about/page";
import HowItWorksPage from "@/app/how-it-works/page";
import { FaqAccordion } from "@/components/howitworks/faq-accordion";
import { DictionaryEntry } from "@/components/brand/dictionary-entry";
import { CategoryPills } from "@/components/home/category-pills";
import { VenuePartnerCta } from "@/components/home/venue-partner-cta";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Public Pages & Brand Surfaces (Base44 Fidelity)", () => {
  describe("About Us Page (/about)", () => {
    it("renders the lifestyle header with the core connection statement", () => {
      render(<AboutPage />);
      expect(
        screen.getByText(/Real connection leads to a happier, healthier life/i)
      ).toBeInTheDocument();
    });

    it("renders the Why It Matters section with Global Flourishing Study citation", () => {
      render(<AboutPage />);
      expect(screen.getByText(/Why it Matters/i)).toBeInTheDocument();
      expect(screen.getByText(/Global Flourishing Study/i)).toBeInTheDocument();
      expect(screen.getByText(/200,000 people across 22 countries/i)).toBeInTheDocument();
    });

    it("renders connection metrics with Happier, Healthier, Fulfilled, Resilient and Our Belief", () => {
      render(<AboutPage />);
      expect(screen.getByText("Happier")).toBeInTheDocument();
      expect(screen.getByText("Healthier")).toBeInTheDocument();
      expect(screen.getByText("More Fulfilled")).toBeInTheDocument();
      expect(screen.getByText("More Resilient")).toBeInTheDocument();
      expect(screen.getByText("Our Belief")).toBeInTheDocument();
      expect(
        screen.getByText(/Better things happen when we do them together/i)
      ).toBeInTheDocument();
    });

    it("renders Who We Are with the founders' story and signatures for Meriam and KJ", () => {
      render(<AboutPage />);
      expect(screen.getByText(/Built by people who like people/i)).toBeInTheDocument();
      expect(screen.getByText(/We’ve been good friends since we were 15/i)).toBeInTheDocument();
      expect(screen.getByText(/Meriam & KJ/i)).toBeInTheDocument();
    });

    it("renders the founder photograph with appropriate alt text", () => {
      render(<AboutPage />);
      const founderImg = screen.getByAltText(/Meriam and KJ, founders of Mingler/i);
      expect(founderImg).toBeInTheDocument();
    });

    it("renders the primary CTA button leading to /browse", () => {
      render(<AboutPage />);
      const browseLink = screen.getByRole("link", { name: /Find your mingle/i });
      expect(browseLink).toBeInTheDocument();
      expect(browseLink).toHaveAttribute("href", "/browse");
    });
  });

  describe("How It Works Page (/how-it-works)", () => {
    it("renders the hero headline and Base44 master infographic banner", () => {
      render(<HowItWorksPage />);
      expect(screen.getByText(/Real people\. Great rooms\./i)).toBeInTheDocument();
      expect(screen.getByText(/Zero awkwardness\./i)).toBeInTheDocument();
      const banner = screen.getByAltText(/Four steps to your next great mingle/i);
      expect(banner).toBeInTheDocument();
    });

    it("renders all four steps with Base44 titles and descriptions", () => {
      render(<HowItWorksPage />);
      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(screen.getByText("Join in seconds")).toBeInTheDocument();

      expect(screen.getByText("Step 2")).toBeInTheDocument();
      expect(screen.getAllByText(/Find your mingle/i).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText("Step 3")).toBeInTheDocument();
      expect(screen.getByText("Show up and mingle")).toBeInTheDocument();

      expect(screen.getByText("Step 4")).toBeInTheDocument();
      expect(screen.getByText("Mingle again")).toBeInTheDocument();
    });

    it("renders the Mingler guarantee section covering safety and privacy", () => {
      render(<HowItWorksPage />);
      expect(screen.getByText(/The Mingler Guarantee/i)).toBeInTheDocument();
      expect(screen.getByText(/Curated London Venues/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy & Data Protection/i)).toBeInTheDocument();
      expect(screen.getByText(/100% Refund Safeguard/i)).toBeInTheDocument();
    });

    it("renders the FAQ section and accordion items", () => {
      render(<HowItWorksPage />);
      expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
      expect(screen.getByText(/Can I come on my own\?/i)).toBeInTheDocument();
      expect(screen.getByText(/How does connecting after a mingle work\?/i)).toBeInTheDocument();
    });
  });

  describe("FaqAccordion Component", () => {
    it("allows toggling answers open and closed", () => {
      render(<FaqAccordion />);
      // First question is open by default
      expect(
        screen.getByText(/Over 70% of minglers attend solo/i)
      ).toBeInTheDocument();

      // Click on second question
      const matchingBtn = screen.getByRole("button", {
        name: /How does connecting after a mingle work\?/i,
      });
      fireEvent.click(matchingBtn);

      expect(
        screen.getByText(/Only when two attendees mutually select each other/i)
      ).toBeInTheDocument();
    });
  });

  describe("Brand & Homepage Polish Components", () => {
    it("renders DictionaryEntry with editorial phonetic definition", () => {
      render(<DictionaryEntry />);
      expect(screen.getByText("/ˈmɪŋ.ɡlər/")).toBeInTheDocument();
      expect(screen.getByText("noun")).toBeInTheDocument();
      expect(
        screen.getByText(/A person who thrives on real conversations in real rooms/i)
      ).toBeInTheDocument();
    });

    it("renders CategoryPills and triggers selection callback", () => {
      const handleSelect = vi.fn();
      render(
        <CategoryPills
          selectedCategory="all"
          onSelectCategory={handleSelect}
        />
      );

      expect(screen.getByText("All Experiences")).toBeInTheDocument();
      expect(screen.getByText("Dinner Parties")).toBeInTheDocument();
      expect(screen.getByText("Cocktail Evenings")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cocktail Evenings"));
      expect(handleSelect).toHaveBeenCalledWith("cocktails");
    });

    it("renders VenuePartnerCta with link to /venue/register", () => {
      render(<VenuePartnerCta />);
      expect(
        screen.getByText(/Host Mingler Experiences at Your Venue/i)
      ).toBeInTheDocument();

      const registerLink = screen.getByRole("link", {
        name: /Register Your Venue/i,
      });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/venue/register");
    });
  });
});
