"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import type { Recipe, RecipeCategory } from "@/types/recipe";
import RecipeCard from "./RecipeCard";
import CategoryFilter from "./CategoryFilter";

type SortOption = "newest" | "oldest" | "a-z" | "z-a";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  "a-z": "A → Z",
  "z-a": "Z → A",
};

const PAGE_SIZE = 20;

function matchesSearch(recipe: Recipe, query: string): boolean {
  const q = query.toLowerCase();

  if (recipe.title.toLowerCase().includes(q)) return true;
  if (recipe.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
  if (recipe.ingredients?.some((ing) => ing.toLowerCase().includes(q)))
    return true;
  if (recipe.instructions?.some((step) => step.toLowerCase().includes(q)))
    return true;
  if (recipe.notes?.toLowerCase().includes(q)) return true;
  if (recipe.source_name?.toLowerCase().includes(q)) return true;

  return false;
}

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "a-z":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "z-a":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

export default function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const [selectedCategory, setSelectedCategory] =
    useState<RecipeCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

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
    let result = recipes;

    if (searchQuery.trim()) {
      result = result.filter((r) => matchesSearch(r, searchQuery.trim()));
    }

    if (selectedCategory) {
      result = result.filter((r) =>
        (r.categories || []).includes(selectedCategory)
      );
    }

    return sortRecipes(result, sortBy);
  }, [recipes, selectedCategory, searchQuery, sortBy]);

  const visibleRecipes = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasMore) loadMore();
        },
        { rootMargin: "200px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasMore, loadMore]
  );

  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveFilter = selectedCategory !== null;

  return (
    <div>
      <div className="relative mb-3 flex gap-2">
        <div className="relative flex-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search recipes, tags, ingredients..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {hasActiveSearch && (
            <button
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-border bg-card text-muted transition-colors hover:text-foreground"
            aria-label="Sort recipes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="16" y2="12" />
              <line x1="4" y1="18" x2="12" y2="18" />
            </svg>
          </button>
          {showSort && (
            <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-border bg-card py-1 shadow-lg">
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setShowSort(false);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-light ${
                      sortBy === key ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <CategoryFilter
          selected={selectedCategory}
          onChange={(cat) => {
            setSelectedCategory(cat);
            setVisibleCount(PAGE_SIZE);
          }}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {hasActiveSearch || hasActiveFilter ? (
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
              <p className="mb-1 text-base font-semibold">No recipes found</p>
              <p className="mb-4 text-sm text-muted">
                {hasActiveSearch && hasActiveFilter
                  ? `No ${selectedCategory!.toLowerCase()} recipes matching "${searchQuery.trim()}"`
                  : hasActiveSearch
                    ? `No recipes matching "${searchQuery.trim()}"`
                    : `No ${selectedCategory!.toLowerCase()} recipes yet`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-light"
              >
                Clear Filters
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
              <h2 className="mb-2 text-lg font-semibold">Welcome to Feeder!</h2>
              <p className="mb-2 max-w-xs text-sm text-muted">
                Your family recipe collection starts here. Paste a URL from any
                recipe website and we&apos;ll extract it for you.
              </p>
              <div className="mb-4 flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary">1</span>
                Find a recipe online
                <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary">2</span>
                Paste the URL
                <span className="rounded-full bg-primary-light px-2 py-0.5 font-medium text-primary">3</span>
                Save it!
              </div>
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
        <>
          <p className="mb-3 text-xs text-muted">
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            {hasActiveSearch || hasActiveFilter ? " found" : ""}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {visibleRecipes.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} priority={i < 4} />
            ))}
          </div>
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
}
