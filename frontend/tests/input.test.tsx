import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input Component", () => {
  it("renders with placeholder and accepts user typing", () => {
    const handleChange = vi.fn();
    render(
      <Input
        placeholder="Enter your email"
        onChange={handleChange}
        data-testid="test-input"
      />
    );

    const input = screen.getByPlaceholderText("Enter your email");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "hello@mingler.co.uk" } });
    expect(handleChange).toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe("hello@mingler.co.uk");
  });

  it("renders error message and adds destructive border class when error prop is provided", () => {
    render(
      <Input
        placeholder="Password"
        error="Password must be at least 8 characters"
      />
    );

    const errorMessage = screen.getByText("Password must be at least 8 characters");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("text-destructive");

    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveClass("border-destructive");
  });

  it("disables input when disabled prop is set", () => {
    render(<Input placeholder="Disabled Field" disabled />);
    const input = screen.getByPlaceholderText("Disabled Field");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:cursor-not-allowed");
  });
});
