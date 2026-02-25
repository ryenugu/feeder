"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedRecipe, RecipeCategory } from "@/types/recipe";
import { RECIPE_CATEGORIES } from "@/types/recipe";
import Image from "next/image";

export default function AddRecipeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedRecipe | null>(null);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const router = useRouter();

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preview, categories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/recipe/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleExtract} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a recipe URL..."
            required
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all active:scale-95 active:bg-primary/80 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Extracting
              </span>
            ) : (
              "Extract"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {preview.image_url && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={preview.image_url}
                  alt={preview.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-snug">
                {preview.title}
              </h3>
              {preview.source_name && (
                <p className="mt-0.5 text-xs text-muted">
                  {preview.source_name}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                {preview.total_time && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {preview.total_time}
                  </span>
                )}
                {preview.servings && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-primary">
                    {preview.servings} servings
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Ingredients ({preview.ingredients.length})
            </h4>
            <ul className="space-y-1 text-sm">
              {preview.ingredients.slice(0, 8).map((ing, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                  {ing}
                </li>
              ))}
              {preview.ingredients.length > 8 && (
                <li className="text-muted">
                  +{preview.ingredients.length - 8} more...
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Instructions ({preview.instructions.length} steps)
            </h4>
            <ul className="space-y-1 text-sm">
              {preview.instructions.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 font-bold text-primary/60">
                    {i + 1}.
                  </span>
                  <span className="line-clamp-2">{step}</span>
                </li>
              ))}
              {preview.instructions.length > 3 && (
                <li className="text-muted">
                  +{preview.instructions.length - 3} more steps...
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {RECIPE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategories((prev) =>
                      prev.includes(cat)
                        ? prev.filter((c) => c !== cat)
                        : [...prev, cat]
                    )
                  }
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors active:scale-95 ${
                    categories.includes(cat)
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted active:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-primary/80 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      )}
    </div>
  );
}
