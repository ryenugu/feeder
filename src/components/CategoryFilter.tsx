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
    <div className="no-scrollbar -mx-4 overflow-x-auto">
      <div className="inline-flex gap-2 px-4">
        <button
          onClick={() => onChange(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
            selected === null
              ? "bg-primary text-white shadow-[0_2px_8px_rgba(45,139,94,0.25)]"
              : "bg-card text-muted border border-border hover:border-border hover:text-foreground"
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
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
                selected === cat
                  ? "bg-primary text-white shadow-[0_2px_8px_rgba(45,139,94,0.25)]"
                  : "bg-card text-muted border border-border hover:border-border hover:text-foreground"
              }`}
            >
              {cat}
              {count !== undefined && count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
        <div className="shrink-0 w-2" aria-hidden="true" />
      </div>
    </div>
  );
}
