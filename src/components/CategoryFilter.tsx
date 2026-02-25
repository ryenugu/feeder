"use client";

import { RECIPE_CATEGORIES, type RecipeCategory } from "@/types/recipe";

interface CategoryFilterProps {
  selected: RecipeCategory | null;
  onChange: (category: RecipeCategory | null) => void;
  counts?: Record<string, number>;
}

export default function CategoryFilter({
  selected,
  onChange,
  counts,
}: CategoryFilterProps) {
  const allCount = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : undefined;

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto pb-2">
      <div className="inline-flex gap-2 px-4">
        <button
          onClick={() => onChange(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
            selected === null
              ? "bg-primary text-white shadow-sm"
              : "bg-card text-muted active:text-foreground border border-border"
          }`}
        >
          All{allCount !== undefined ? ` (${allCount})` : ""}
        </button>
        {RECIPE_CATEGORIES.map((cat) => {
          const count = counts?.[cat];
          return (
            <button
              key={cat}
              onClick={() => onChange(selected === cat ? null : cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
                selected === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card text-muted active:text-foreground border border-border"
              }`}
            >
              {cat}
              {count !== undefined && count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
        <div className="shrink-0 w-px" aria-hidden="true" />
      </div>
    </div>
  );
}
