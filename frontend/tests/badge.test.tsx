import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge Component", () => {
  it("renders with default styling and text", () => {
    render(<Badge>Dinner Party</Badge>);
    const badge = screen.getByText("Dinner Party");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-brand-navy");
    expect(badge).toHaveClass("text-brand-ivory");
  });

  it("applies the coral variant for highlights", () => {
    render(<Badge variant="coral">Only 2 Spots Left</Badge>);
    const badge = screen.getByText("Only 2 Spots Left");
    expect(badge).toHaveClass("text-brand-coral");
    expect(badge).toHaveClass("border-brand-coral/30");
  });

  it("applies success and warning variants correctly", () => {
    const { rerender } = render(<Badge variant="success">Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toHaveClass("text-emerald-700");

    rerender(<Badge variant="warning">Pending</Badge>);
    expect(screen.getByText("Pending")).toHaveClass("text-amber-700");
  });
});
