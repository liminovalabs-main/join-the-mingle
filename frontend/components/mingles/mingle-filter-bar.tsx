"use client";

import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

export interface FilterState {
  search: string;
  type: string;
  date: string;
  area: string;
  age: string;
}

interface MingleFilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

const EXPERIENCE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "cocktails", label: "Cocktails" },
  { value: "dinner", label: "Dinner Party" },
  { value: "wine_tasting", label: "Wine Tasting" },
  { value: "brunch", label: "Brunch" },
  { value: "cooking", label: "Cooking" },
  { value: "games", label: "Games Night" },
  { value: "cultural", label: "Cultural" },
  { value: "wellness", label: "Wellness" },
];

const LONDON_AREAS = [
  "All London",
  "Shoreditch",
  "Soho",
  "Brixton",
  "Mayfair",
  "Covent Garden",
  "Kensington",
  "Camden",
  "Hackney",
  "Marylebone",
];

export function MingleFilterBar({ filters, onChange }: MingleFilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleTypeSelect = (typeVal: string) => {
    onChange({ ...filters, type: typeVal });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, date: e.target.value });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, area: e.target.value });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, age: e.target.value });
  };

  return (
    <div className="mb-8 space-y-4 rounded-2xl sm:rounded-3xl border border-border/70 bg-white p-4 sm:p-6 shadow-xs text-left">
      {/* 1. Search Input — Responsive with Accessible Touch Target */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search experiences, venues, areas…"
          className="w-full rounded-full border border-border/70 bg-brand-ivory/30 py-3 sm:py-3.5 pl-12 pr-4 text-sm sm:text-base font-medium text-brand-navy placeholder:text-muted-foreground focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-coral/20 transition-all"
        />
      </div>

      {/* 2. Experience Type Filter Pills — Full Responsive Wrap on Mobile & Tablet */}
      <div className="pt-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="mr-1 flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground shrink-0 py-1">
            <SlidersHorizontal className="h-4 w-4 text-brand-coral" /> Type:
          </span>
          {EXPERIENCE_TYPES.map((t) => {
            const isSelected = filters.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeSelect(t.value)}
                className={`rounded-full px-4 sm:px-4.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-navy text-white shadow-xs"
                    : "bg-brand-stone/40 text-brand-navy hover:bg-brand-stone/70"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dropdown Selects — Clean Responsive 1-col on Mobile, 3-col on Tablet & Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border/50">
        {/* Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <label
            htmlFor="filter-date"
            className="text-xs sm:text-sm font-semibold text-brand-navy/80 shrink-0"
          >
            Date:
          </label>
          <div className="relative w-full">
            <select
              id="filter-date"
              value={filters.date}
              onChange={handleDateChange}
              className="w-full appearance-none rounded-full border border-border/70 bg-brand-ivory/40 py-2 sm:py-2.5 pl-4 pr-9 text-xs sm:text-sm font-medium text-brand-navy focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-coral/20 cursor-pointer"
            >
              <option value="upcoming">Upcoming Only</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
              <option value="all">All (incl. Past)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* London Borough / Area Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <label
            htmlFor="filter-area"
            className="text-xs sm:text-sm font-semibold text-brand-navy/80 shrink-0"
          >
            Area:
          </label>
          <div className="relative w-full">
            <select
              id="filter-area"
              value={filters.area}
              onChange={handleAreaChange}
              className="w-full appearance-none rounded-full border border-border/70 bg-brand-ivory/40 py-2 sm:py-2.5 pl-4 pr-9 text-xs sm:text-sm font-medium text-brand-navy focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-coral/20 cursor-pointer"
            >
              {LONDON_AREAS.map((a) => (
                <option key={a} value={a === "All London" ? "all" : a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Age Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
          <label
            htmlFor="filter-age"
            className="text-xs sm:text-sm font-semibold text-brand-navy/80 shrink-0"
          >
            Age:
          </label>
          <div className="relative w-full">
            <select
              id="filter-age"
              value={filters.age}
              onChange={handleAgeChange}
              className="w-full appearance-none rounded-full border border-border/70 bg-brand-ivory/40 py-2 sm:py-2.5 pl-4 pr-9 text-xs sm:text-sm font-medium text-brand-navy focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-coral/20 cursor-pointer"
            >
              <option value="all">Any age</option>
              <option value="18-25">18–25</option>
              <option value="25-35">25–35</option>
              <option value="35-45">35–45</option>
              <option value="45-60">45–60</option>
              <option value="60-100">60+</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default MingleFilterBar;
