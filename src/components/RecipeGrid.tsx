"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Recipe, RecipeCategory } from "@/types/recipe";
import RecipeCard from "./RecipeCard";
import CategoryFilter from "./CategoryFilter";

export default function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const [selectedCategory, setSelectedCategory] =
    useState<RecipeCategory | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipes) {
      for (const cat of r.categories || []) {
        map[cat] = (map[cat] || 0) + 1;
      }
    }
    return map;
  }, [recipes]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return recipes;
    return recipes.filter((r) =>
      (r.categories || []).includes(selectedCategory)
    );
  }, [recipes, selectedCategory]);

  return (
    <div>
      <div className="mb-4">
        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {selectedCategory ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-primary"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="mb-1 text-base font-semibold">
                No {selectedCategory.toLowerCase()} recipes
              </p>
              <p className="mb-4 text-sm text-muted">
                Add a recipe and tag it as &ldquo;{selectedCategory}&rdquo;
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-light"
              >
                Show All Recipes
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-primary"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h2 className="mb-1 text-lg font-semibold">No recipes yet</h2>
              <p className="mb-4 text-sm text-muted">
                Paste a recipe URL to get started
              </p>
              <Link
                href="/add"
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Add Your First Recipe
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
