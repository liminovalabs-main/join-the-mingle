import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/context/auth-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Navbar Component", () => {
  it("renders the brand logo and desktop navigation links", () => {
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    );

    // Brand link
    const brandLink = screen.getByLabelText(/mingler — home/i);
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "/");

    // Public navigation links
    expect(screen.getByText("Mingles")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();

    // Auth links
    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Join Mingler")).toBeInTheDocument();
  });

  it("toggles the mobile menu when the hamburger button is clicked", () => {
    render(
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    );

    const menuButton = screen.getByLabelText(/open menu/i);
    expect(menuButton).toBeInTheDocument();

    // Click to open mobile menu
    fireEvent.click(menuButton);
    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();

    // Mobile menu items should now be in the DOM
    const minglesLinks = screen.getAllByText("Mingles");
    expect(minglesLinks.length).toBeGreaterThan(1); // desktop + mobile

    // Click again to close
    fireEvent.click(screen.getByLabelText(/close menu/i));
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
  });
});
