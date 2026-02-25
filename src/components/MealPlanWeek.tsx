"use client";

import { useState, useEffect, useCallback } from "react";
import type { Recipe, MealPlanEntry } from "@/types/recipe";
import Image from "next/image";

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek + offset * 7);
  sunday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0];
  const end = dates[6];
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} \u2013 ${end.toLocaleDateString("en-US", opts)}`;
}

function isToday(d: Date): boolean {
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export default function MealPlanWeek() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const dates = getWeekDates(weekOffset);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const start = formatDate(dates[0]);
    const end = formatDate(dates[6]);
    try {
      const res = await fetch(
        `/api/meal-plans?start=${start}&end=${end}`
      );
      if (res.ok) setEntries(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) setRecipes(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  async function addToDay(recipeId: string, date: string) {
    try {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          planned_date: date,
          meal_type: "dinner",
        }),
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries((prev) => [...prev, entry]);
      }
    } catch {
      /* ignore */
    }
    setShowPicker(null);
  }

  async function removeEntry(entryId: string) {
    try {
      const res = await fetch(`/api/meal-plans?id=${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      {/* Week navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 text-primary"
          aria-label="Previous week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-base font-bold">{formatWeekRange(dates)}</h2>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 text-primary"
          aria-label="Next week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => {
            const dateStr = formatDate(date);
            const dayEntries = entries.filter(
              (e) => e.planned_date === dateStr
            );
            const today = isToday(date);

            return (
              <div key={dateStr}>
                <div className="mb-2 flex items-center justify-between">
                  <h3
                    className={`text-sm font-bold ${
                      today ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {formatDateLabel(date)}
                  </h3>
                  <button
                    onClick={() =>
                      setShowPicker(showPicker === dateStr ? null : dateStr)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-white"
                    aria-label="Add meal"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>

                {dayEntries.length === 0 ? (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm text-muted ${
                      today ? "bg-primary/5 dark:bg-primary/10" : "bg-card"
                    }`}
                  >
                    Add a meal to get started
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                          today ? "bg-primary/5 dark:bg-primary/10" : "bg-card"
                        }`}
                      >
                        {entry.recipe?.image_url && (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={entry.recipe.image_url}
                              alt={entry.recipe?.title || ""}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {entry.recipe?.title || "Recipe"}
                        </span>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="shrink-0 p-1 text-muted hover:text-red-500"
                          aria-label="Remove"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recipe picker */}
                {showPicker === dateStr && (
                  <div className="mt-2 rounded-xl border border-border bg-card p-3 shadow-md">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Pick a recipe
                    </p>
                    {recipes.length === 0 ? (
                      <p className="text-sm text-muted">
                        No saved recipes yet. Add one first!
                      </p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {recipes.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => addToDay(r.id, dateStr)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-primary-light"
                          >
                            {r.image_url && (
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={r.image_url}
                                  alt={r.title}
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
                            )}
                            <span className="truncate">{r.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
