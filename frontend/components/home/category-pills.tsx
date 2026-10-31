"use client";

import * as React from "react";
import { Utensils, GlassWater, Wine, Coffee, ChefHat, Sparkles, Trophy, Flower2 } from "lucide-react";

export interface CategoryOption {
  key: string;
  label: string;
  icon?: React.ElementType;
}

export const CATEGORIES: CategoryOption[] = [
  { key: "all", label: "All Experiences" },
  { key: "dinner", label: "Dinner Parties", icon: Utensils },
  { key: "cocktails", label: "Cocktail Evenings", icon: GlassWater },
  { key: "wine_tasting", label: "Wine Tastings", icon: Wine },
  { key: "brunch", label: "Brunches", icon: Coffee },
  { key: "cooking", label: "Cooking Classes", icon: ChefHat },
  { key: "games", label: "Games & Trivia", icon: Trophy },
  { key: "cultural", label: "Arts & Culture", icon: Sparkles },
  { key: "wellness", label: "Wellness", icon: Flower2 },
];

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (categoryKey: string) => void;
}

export function CategoryPills({
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2.5 min-w-max">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand-coral text-white shadow-md shadow-brand-coral/25 ring-2 ring-brand-coral/30"
                  : "bg-white text-brand-navy/70 hover:bg-brand-stone/30 border border-border/70 hover:text-brand-navy"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
