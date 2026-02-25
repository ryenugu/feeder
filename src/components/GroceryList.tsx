"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, X, Store } from "lucide-react";

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
  sort_order: number;
  items: GroceryItem[];
}

const PRESET_STORES = [
  {
    name: "Trader Joe's",
    items: ["Yogurt tubes", "Eggs", "Mac cheese", "Burrito"],
  },
  {
    name: "Costco",
    items: ["Tissues", "Paper towels", "Oz bites", "Kerrygold butter", "Coconut water"],
  },
  {
    name: "Marc's",
    items: ["Meatballs", "Spaghetti sauce", "Perogies"],
  },
];

export default function GroceryList() {
  const [stores, setStores] = useState<GroceryStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [addingStore, setAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [editStoreText, setEditStoreText] = useState("");
  const newStoreInputRef = useRef<HTMLInputElement>(null);
  const editStoreInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/groceries");
      if (res.ok) {
        const data: GroceryStore[] = await res.json();
        if (data.length === 0) {
          await seedPresets();
          return;
        }
        setStores(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (addingStore && newStoreInputRef.current) {
      newStoreInputRef.current.focus();
    }
  }, [addingStore]);

  useEffect(() => {
    if (editingStore && editStoreInputRef.current) {
      editStoreInputRef.current.focus();
    }
  }, [editingStore]);

  async function seedPresets() {
    try {
      const created: GroceryStore[] = [];
      for (let i = 0; i < PRESET_STORES.length; i++) {
        const preset = PRESET_STORES[i];
        const res = await fetch("/api/groceries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "store", name: preset.name, sort_order: i }),
        });
        if (!res.ok) continue;
        const store: GroceryStore = await res.json();

        for (let j = 0; j < preset.items.length; j++) {
          const itemRes = await fetch("/api/groceries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "item",
              store_id: store.id,
              name: preset.items[j],
              sort_order: j,
            }),
          });
          if (itemRes.ok) {
            const item = await itemRes.json();
            store.items.push(item);
          }
        }
        created.push(store);
      }
      setStores(created);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  function toggleCollapse(storeId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  }

  async function toggleItemChecked(item: GroceryItem) {
    setStores((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) =>
          i.id === item.id ? { ...i, checked: !i.checked } : i
        ),
      }))
    );

    await fetch("/api/groceries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", id: item.id, checked: !item.checked }),
    });
  }

  async function addItem(storeId: string) {
    const name = (newItemText[storeId] || "").trim();
    if (!name) return;

    const store = stores.find((s) => s.id === storeId);
    const sortOrder = store ? store.items.length : 0;

    const res = await fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", store_id: storeId, name, sort_order: sortOrder }),
    });

    if (res.ok) {
      const item: GroceryItem = await res.json();
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId ? { ...s, items: [...s.items, item] } : s
        )
      );
      setNewItemText((prev) => ({ ...prev, [storeId]: "" }));
      setTimeout(() => newItemInputRefs.current[storeId]?.focus(), 0);
    }
  }

  async function deleteItem(itemId: string) {
    setStores((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== itemId),
      }))
    );

    await fetch(`/api/groceries?type=item&id=${itemId}`, { method: "DELETE" });
  }

  async function addStore() {
    const name = newStoreName.trim();
    if (!name) return;

    const res = await fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "store", name, sort_order: stores.length }),
    });

    if (res.ok) {
      const store: GroceryStore = await res.json();
      setStores((prev) => [...prev, store]);
      setNewStoreName("");
      setAddingStore(false);
    }
  }

  async function deleteStore(storeId: string) {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    await fetch(`/api/groceries?type=store&id=${storeId}`, { method: "DELETE" });
  }

  async function renameStore(storeId: string) {
    const name = editStoreText.trim();
    if (!name) return;

    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, name } : s))
    );
    setEditingStore(null);

    await fetch("/api/groceries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "store", id: storeId, name }),
    });
  }

  const totalItems = stores.reduce((sum, s) => sum + s.items.length, 0);
  const uncheckedItems = stores.reduce(
    (sum, s) => sum + s.items.filter((i) => !i.checked).length,
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {totalItems > 0 && (
        <p className="mb-4 text-sm text-muted">
          {uncheckedItems} item{uncheckedItems !== 1 ? "s" : ""} remaining
          {" · "}
          {stores.length} store{stores.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-3">
        {stores.map((store) => {
          const isCollapsed = collapsed.has(store.id);
          const storeUnchecked = store.items.filter((i) => !i.checked).length;
          const sortedItems = [...store.items].sort((a, b) => {
            if (a.checked !== b.checked) return a.checked ? 1 : -1;
            return a.sort_order - b.sort_order;
          });

          return (
            <div key={store.id} className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-2 px-3 py-3">
                <button
                  onClick={() => toggleCollapse(store.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-muted" />
                  )}
                  {editingStore === store.id ? (
                    <input
                      ref={editStoreInputRef}
                      value={editStoreText}
                      onChange={(e) => setEditStoreText(e.target.value)}
                      onBlur={() => renameStore(store.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameStore(store.id);
                        if (e.key === "Escape") setEditingStore(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 rounded bg-transparent text-sm font-semibold outline-none ring-1 ring-primary/30 px-1"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-semibold">{store.name}</span>
                  )}
                </button>
                <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                  {storeUnchecked}/{store.items.length}
                </span>
                <button
                  onClick={() => {
                    setEditingStore(store.id);
                    setEditStoreText(store.name);
                  }}
                  className="p-1 text-muted transition-colors hover:text-primary"
                  aria-label="Rename store"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteStore(store.id)}
                  className="p-1 text-muted transition-colors hover:text-red-500"
                  aria-label="Delete store"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {!isCollapsed && (
                <div className="border-t border-border/30 px-3 pb-3">
                  {sortedItems.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted">No items yet</p>
                  ) : (
                    <div className="space-y-0.5 pt-1">
                      {sortedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-center gap-3 rounded-lg px-1 py-2 ${
                            item.checked ? "opacity-40" : ""
                          }`}
                        >
                          <button
                            onClick={() => toggleItemChecked(item)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                item.checked ? "border-primary bg-primary" : "border-border"
                              }`}
                            >
                              {item.checked && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <span className={`text-sm leading-relaxed ${item.checked ? "line-through" : ""}`}>
                              {item.name}
                            </span>
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100"
                            aria-label="Delete item"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Plus size={16} className="shrink-0 text-muted" />
                    <input
                      ref={(el) => { newItemInputRefs.current[store.id] = el; }}
                      type="text"
                      placeholder="Add item..."
                      value={newItemText[store.id] || ""}
                      onChange={(e) =>
                        setNewItemText((prev) => ({ ...prev, [store.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addItem(store.id);
                      }}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addingStore ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-3 py-3">
          <Store size={16} className="shrink-0 text-primary" />
          <input
            ref={newStoreInputRef}
            type="text"
            placeholder="Store name..."
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addStore();
              if (e.key === "Escape") {
                setAddingStore(false);
                setNewStoreName("");
              }
            }}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted/60"
          />
          <button
            onClick={addStore}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors active:scale-95"
          >
            Add
          </button>
          <button
            onClick={() => {
              setAddingStore(false);
              setNewStoreName("");
            }}
            className="p-1 text-muted"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingStore(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-3 text-sm font-medium text-muted transition-colors active:bg-primary-light/30"
        >
          <Plus size={16} />
          Add Store
        </button>
      )}
    </div>
  );
}
