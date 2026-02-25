"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Recipe, RecipeCategory } from "@/types/recipe";
import { RECIPE_CATEGORIES } from "@/types/recipe";
import IngredientList from "@/components/IngredientList";
import InstructionList from "@/components/InstructionList";
import ServingAdjuster from "@/components/ServingAdjuster";
import { useToast } from "@/components/Toast";
import ShareSheet from "@/components/ShareSheet";
import defaultImage from "@/images/default.jpg";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecipe(data);
          if (data.servings) setServings(data.servings);
          setNotesValue(data.notes || "");
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleDelete() {
    if (!recipe) return;
    const deletedRecipe = { ...recipe };

    setRecipe(null);

    try {
      await fetch(`/api/recipes/${params.id}`, { method: "DELETE" });
    } catch {
      setRecipe(deletedRecipe);
      return;
    }

    router.push("/");
    router.refresh();

    showToast({
      message: "Recipe deleted",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            const res = await fetch("/api/recipes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: deletedRecipe.title,
                image_url: deletedRecipe.image_url,
                source_url: deletedRecipe.source_url,
                source_name: deletedRecipe.source_name,
                total_time: deletedRecipe.total_time,
                prep_time: deletedRecipe.prep_time,
                cook_time: deletedRecipe.cook_time,
                servings: deletedRecipe.servings,
                ingredients: deletedRecipe.ingredients,
                instructions: deletedRecipe.instructions,
                notes: deletedRecipe.notes,
                tags: deletedRecipe.tags,
                categories: deletedRecipe.categories,
                source_images: deletedRecipe.source_images,
              }),
            });
            if (res.ok) {
              const restored = await res.json();
              router.push(`/recipe/${restored.id}`);
              router.refresh();
            }
          } catch {
            /* ignore */
          }
        },
      },
    });
  }

  async function handleCategoryToggle(cat: RecipeCategory) {
    if (!recipe) return;
    const current = recipe.categories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setRecipe({ ...recipe, categories: updated });
    try {
      await fetch(`/api/recipes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: updated }),
      });
      router.refresh();
    } catch {
      setRecipe({ ...recipe, categories: current });
    }
  }

  function getShareText() {
    if (!recipe) return "";
    return [
      recipe.title,
      "",
      recipe.total_time ? `Time: ${recipe.total_time}` : null,
      recipe.servings ? `Servings: ${recipe.servings}` : null,
      "",
      "INGREDIENTS:",
      ...recipe.ingredients.map((i) => `• ${i}`),
      "",
      "INSTRUCTIONS:",
      ...recipe.instructions.map((s, i) => `${i + 1}. ${s}`),
      recipe.notes ? `\nNOTES:\n${recipe.notes}` : null,
      recipe.source_url ? `\nSource: ${recipe.source_url}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  function openShare() {
    setShowMenu(false);
    setShowShare(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-lg font-semibold">Recipe not found</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {recipe.image_url && !imgError ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
            loading="eager"
            onError={() => setImgError(true)}
            unoptimized={recipe.image_url.toLowerCase().endsWith(".jfif")}
          />
        ) : (
          <Image
            src={defaultImage}
            alt={recipe.title}
            fill
            placeholder="blur"
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div
        className="absolute top-0 left-0 right-0 safe-top flex items-center justify-between p-4"
      >
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-white shadow-md backdrop-blur-sm active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur-sm active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 z-10 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
              <Link
                href={`/recipe/${recipe.id}/edit`}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary-light"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Recipe
              </Link>
              <button
                onClick={openShare}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-primary-light"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share Recipe
              </button>
              {recipe.source_url && recipe.source_url !== "uploaded-document" && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary-light"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View Original
                </a>
              )}
              <hr className="my-1 border-border" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete Recipe
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative -mt-4 rounded-t-3xl bg-background px-5 pt-6">
        <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>

        {recipe.source_name && recipe.source_url !== "uploaded-document" && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            Source: {recipe.source_name}
          </a>
        )}

        {/* Source images from document uploads */}
        {recipe.source_images && recipe.source_images.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">
              Original Document
            </h2>
            <div className={`flex gap-2 overflow-x-auto no-scrollbar ${
              recipe.source_images.length === 1 ? "" : "pb-2"
            }`}>
              {recipe.source_images.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative shrink-0 overflow-hidden rounded-xl border border-border active:scale-[0.98] transition-transform"
                  style={{
                    width: recipe.source_images!.length === 1 ? "100%" : "200px",
                    aspectRatio: "3/4",
                  }}
                >
                  <Image
                    src={src}
                    alt={`Source page ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes={recipe.source_images!.length === 1 ? "100vw" : "200px"}
                    unoptimized
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Categories */}
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {RECIPE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
                (recipe.categories || []).includes(cat)
                  ? "bg-primary text-white"
                  : "border border-border text-muted active:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Time & servings */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {recipe.total_time && (
            <div>
              <p className="text-xs text-muted">Total Time</p>
              <p className="text-base font-bold text-primary">
                {recipe.total_time}
              </p>
            </div>
          )}
          {recipe.prep_time && (
            <div>
              <p className="text-xs text-muted">Prep</p>
              <p className="text-base font-bold text-primary">
                {recipe.prep_time}
              </p>
            </div>
          )}
          {recipe.cook_time && (
            <div>
              <p className="text-xs text-muted">Cook</p>
              <p className="text-base font-bold text-primary">
                {recipe.cook_time}
              </p>
            </div>
          )}
          {recipe.servings && (
            <ServingAdjuster servings={servings} onChange={setServings} />
          )}
        </div>

        {/* Link-only recipe banner */}
        {recipe.ingredients.length === 0 && recipe.instructions.length === 0 && recipe.source_url && recipe.source_url !== "uploaded-document" && (
          <section className="mt-8">
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-4 transition-colors hover:bg-primary/15 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">View Original Recipe</p>
                <p className="truncate text-xs text-muted">{recipe.source_url}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary/60">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </section>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
              Ingredients
            </h2>
            <IngredientList
              ingredients={recipe.ingredients}
              originalServings={recipe.servings}
              currentServings={servings}
            />
          </section>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
              Instructions
            </h2>
            <InstructionList instructions={recipe.instructions} />
          </section>
        )}

        {/* Notes */}
        <section className="mt-8">
          <h2 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
            Notes
          </h2>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add any personal notes, tips, or modifications..."
                rows={3}
                autoFocus
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingNotes(false);
                    setNotesValue(recipe.notes || "");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const trimmed = notesValue.trim();
                    setRecipe({ ...recipe, notes: trimmed || null });
                    setEditingNotes(false);
                    try {
                      await fetch(`/api/recipes/${params.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notes: trimmed || null }),
                      });
                      router.refresh();
                    } catch { /* ignore */ }
                  }}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="w-full text-left rounded-xl px-2 py-2 text-sm leading-relaxed transition-colors hover:bg-card active:bg-card"
            >
              {recipe.notes ? (
                <span className="text-foreground/80">{recipe.notes}</span>
              ) : (
                <span className="text-muted italic">Tap to add notes...</span>
              )}
            </button>
          )}
        </section>
      </div>

      {recipe && (
        <ShareSheet
          open={showShare}
          onClose={() => setShowShare(false)}
          title={recipe.title}
          url={typeof window !== "undefined" ? window.location.href : ""}
          text={getShareText()}
          showToast={showToast}
        />
      )}
    </div>
  );
}
