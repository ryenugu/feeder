"use client";

import { useState, useEffect, useCallback } from "react";

interface GroceryItem {
  id: string;
  store_id: string;
  name: string;
  checked: boolean;
  sort_order: number;
}

interface GroceryStore {
  id: string;
  name: string;
  items: GroceryItem[];
}

interface GroupedIngredient {
  key: string;
  display: string;
  original: string[];
}

interface CombinedShoppingListProps {
  groupedIngredients: GroupedIngredient[];
  loading: boolean;
}

export default function CombinedShoppingList({
  groupedIngredients,
  loading: recipeLoading,
}: CombinedShoppingListProps) {
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(true);
  const [bought, setBought] = useState<Set<string>>(new Set());

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/groceries");
      if (res.ok) setStores(await res.json());
    } catch {
      /* ignore */
    } finally {
      setGroceryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  function toggleBought(key: string) {
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedGroceryItems = stores.flatMap((store) =>
    store.items
      .filter((i) => i.checked)
      .map((i) => ({ ...i, storeName: store.name }))
  );

  const unboughtGroceryCount = selectedGroceryItems.filter(
    (i) => !bought.has(`grocery-${i.id}`)
  ).length;
  const unboughtRecipeCount = groupedIngredients.filter(
    (g) => !bought.has(`recipe-${g.key}`)
  ).length;
  const totalRemaining = unboughtGroceryCount + unboughtRecipeCount;
  const totalItems = selectedGroceryItems.length + groupedIngredients.length;

  const isLoading = recipeLoading || groceryLoading;

  async function copyList() {
    const groceryLines = selectedGroceryItems
      .filter((i) => !bought.has(`grocery-${i.id}`))
      .map((i) => `☐ ${i.name} (${i.storeName})`);
    const recipeLines = groupedIngredients
      .filter((g) => !bought.has(`recipe-${g.key}`))
      .map((g) => `☐ ${g.display}`);
    const text = [...groceryLines, ...recipeLines].join("\n");
    await navigator.clipboard.writeText(text || "No items");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
        <h2 className="mb-1 text-lg font-semibold">Nothing to buy</h2>
        <p className="text-sm text-muted">
          Check off items in the Groceries tab or plan meals to build your list
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {totalRemaining} item{totalRemaining !== 1 ? "s" : ""} remaining
        </p>
        {totalRemaining > 0 && (
          <button
            onClick={copyList}
            className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary transition-colors active:scale-95"
          >
            Copy List
          </button>
        )}
      </div>

      {selectedGroceryItems.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            From your stores
          </h3>
          <div className="space-y-0.5">
            {selectedGroceryItems
              .filter((i) => !bought.has(`grocery-${i.id}`))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleBought(`grocery-${item.id}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors active:bg-primary-light/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors" />
                  <span className="flex-1 text-sm leading-relaxed">{item.name}</span>
                  <span className="mt-0.5 rounded-full bg-primary-light/70 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {item.storeName}
                  </span>
                </button>
              ))}
            {selectedGroceryItems
              .filter((i) => bought.has(`grocery-${i.id}`))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleBought(`grocery-${item.id}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left opacity-40 transition-colors active:bg-primary-light/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="flex-1 text-sm leading-relaxed line-through">{item.name}</span>
                  <span className="mt-0.5 rounded-full bg-primary-light/70 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {item.storeName}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {groupedIngredients.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            From recipes
          </h3>
          <div className="space-y-0.5">
            {groupedIngredients
              .filter((g) => !bought.has(`recipe-${g.key}`))
              .map((group) => (
                <button
                  key={group.key}
                  onClick={() => toggleBought(`recipe-${group.key}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors active:bg-primary-light/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors" />
                  <span className="text-sm leading-relaxed">{group.display}</span>
                </button>
              ))}
            {groupedIngredients
              .filter((g) => bought.has(`recipe-${g.key}`))
              .map((group) => (
                <button
                  key={group.key}
                  onClick={() => toggleBought(`recipe-${group.key}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left opacity-40 transition-colors active:bg-primary-light/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed line-through">{group.display}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
