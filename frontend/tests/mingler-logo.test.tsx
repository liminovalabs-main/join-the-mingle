import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MinglerLogo, IGlyph, MinglerWord } from "@/components/brand/mingler-logo";

describe("Mingler Brand Components", () => {
  it("renders the IGlyph with coral head and ivory body by default", () => {
    const { container } = render(<IGlyph />);
    const wrapper = container.querySelector("span[aria-hidden='true']");
    expect(wrapper).toBeInTheDocument();

    const dot = wrapper?.querySelector(".bg-brand-coral");
    const stem = wrapper?.querySelector(".bg-brand-ivory");
    expect(dot).toBeInTheDocument();
    expect(stem).toBeInTheDocument();
  });

  it("renders MinglerWord by substituting the first 'i' with IGlyph", () => {
    const { container } = render(<MinglerWord>mingler</MinglerWord>);
    expect(container.textContent).toContain("m");
    expect(container.textContent).toContain("ngler");

    const glyph = container.querySelector("span[aria-hidden='true']");
    expect(glyph).toBeInTheDocument();
  });

  it("renders text without 'i' untouched", () => {
    render(<MinglerWord>London</MinglerWord>);
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("renders MinglerLogo with signature branding styles", () => {
    const { container } = render(<MinglerLogo />);
    const logoWrapper = container.firstChild as HTMLElement;
    expect(logoWrapper).toHaveClass("font-heading");
    expect(logoWrapper).toHaveClass("font-black");
    expect(logoWrapper).toHaveClass("text-brand-ivory");
  });
});
