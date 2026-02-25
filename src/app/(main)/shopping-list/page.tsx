"use client";

import { useState, useEffect, useMemo } from "react";
import type { MealPlanEntry } from "@/types/recipe";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekDates(offset: number): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek + offset * 7);
  sunday.setHours(0, 0, 0, 0);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { start: formatDate(sunday), end: formatDate(saturday) };
}

function normalizeIngredient(ing: string): { qty: string; item: string } {
  const match = ing.match(/^([\d\s\/½¼¾⅓⅔⅛.]+)?\s*(.+)$/);
  if (match) {
    return { qty: (match[1] || "").trim(), item: match[2].trim().toLowerCase() };
  }
  return { qty: "", item: ing.trim().toLowerCase() };
}

export default function ShoppingListPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const { start, end } = getWeekDates(weekOffset);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meal-plans?start=${start}&end=${end}`);
        if (res.ok) setEntries(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [start, end]);

  const groupedIngredients = useMemo(() => {
    const allIngredients: string[] = [];
    for (const entry of entries) {
      if (entry.recipe?.ingredients) {
        allIngredients.push(...entry.recipe.ingredients);
      }
    }

    const grouped = new Map<string, string[]>();
    for (const ing of allIngredients) {
      const { item } = normalizeIngredient(ing);
      const existing = grouped.get(item);
      if (existing) {
        existing.push(ing);
      } else {
        grouped.set(item, [ing]);
      }
    }

    return Array.from(grouped.entries())
      .map(([key, items]) => ({
        key,
        display: items.length > 1 ? `${items[0]} (+${items.length - 1} more)` : items[0],
        original: items,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [entries]);

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const weekLabel = (() => {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
  })();

  const uncheckedCount = groupedIngredients.filter((g) => !checked.has(g.key)).length;

  async function copyList() {
    const items = groupedIngredients
      .filter((g) => !checked.has(g.key))
      .map((g) => `☐ ${g.display}`)
      .join("\n");
    await navigator.clipboard.writeText(items || "No items");
  }

  return (
    <div className="px-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Shopping List</h1>
        {groupedIngredients.length > 0 && (
          <button
            onClick={copyList}
            className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary transition-colors active:scale-95"
          >
            Copy List
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="p-2 text-primary" aria-label="Previous week">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-base font-bold">{weekLabel}</h2>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 text-primary" aria-label="Next week">
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
      ) : groupedIngredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <h2 className="mb-1 text-lg font-semibold">No meals planned</h2>
          <p className="text-sm text-muted">
            Add recipes to your meal plan to generate a shopping list
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            {uncheckedCount} item{uncheckedCount !== 1 ? "s" : ""} remaining
            {" · "}
            {entries.length} meal{entries.length !== 1 ? "s" : ""} planned
          </p>

          <div className="space-y-1">
            {groupedIngredients.map((group) => {
              const isChecked = checked.has(group.key);
              return (
                <button
                  key={group.key}
                  onClick={() => toggleItem(group.key)}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors active:bg-primary-light/50 ${
                    isChecked ? "opacity-40" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isChecked ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm leading-relaxed ${isChecked ? "line-through" : ""}`}>
                    {group.display}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
