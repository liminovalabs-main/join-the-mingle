import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MingleFilterBar, FilterState } from "@/components/mingles/mingle-filter-bar";

const initialFilters: FilterState = {
  search: "",
  type: "all",
  date: "upcoming",
  area: "all",
  age: "all",
};

describe("MingleFilterBar Component", () => {
  it("renders search input, all experience type pills, and dropdown selectors", () => {
    const handleChange = vi.fn();
    render(<MingleFilterBar filters={initialFilters} onChange={handleChange} />);

    expect(screen.getByPlaceholderText(/Search experiences, venues, areas/i)).toBeDefined();
    expect(screen.getByText("All Types")).toBeDefined();
    expect(screen.getByText("Cocktails")).toBeDefined();
    expect(screen.getByText("Dinner Party")).toBeDefined();
    expect(screen.getByText("Wine Tasting")).toBeDefined();
    expect(screen.getByLabelText(/Date:/i)).toBeDefined();
    expect(screen.getByLabelText(/Area:/i)).toBeDefined();
    expect(screen.getByLabelText(/Age:/i)).toBeDefined();
  });

  it("triggers onChange when an experience type pill is clicked", () => {
    const handleChange = vi.fn();
    render(<MingleFilterBar filters={initialFilters} onChange={handleChange} />);

    const cocktailsButton = screen.getByText("Cocktails");
    fireEvent.click(cocktailsButton);

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      type: "cocktails",
    });
  });

  it("triggers onChange when search text is entered", () => {
    const handleChange = vi.fn();
    render(<MingleFilterBar filters={initialFilters} onChange={handleChange} />);

    const searchInput = screen.getByPlaceholderText(/Search experiences, venues, areas/i);
    fireEvent.change(searchInput, { target: { value: "Shoreditch" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      search: "Shoreditch",
    });
  });

  it("triggers onChange when date filter is changed", () => {
    const handleChange = vi.fn();
    render(<MingleFilterBar filters={initialFilters} onChange={handleChange} />);

    const dateSelect = screen.getByLabelText(/Date:/i);
    fireEvent.change(dateSelect, { target: { value: "week" } });

    expect(handleChange).toHaveBeenCalledWith({
      ...initialFilters,
      date: "week",
    });
  });
});
