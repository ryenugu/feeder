"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Recipe } from "@/types/recipe";
import IngredientList from "@/components/IngredientList";
import InstructionList from "@/components/InstructionList";
import ServingAdjuster from "@/components/ServingAdjuster";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecipe(data);
          if (data.servings) setServings(data.servings);
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
    if (!confirm("Delete this recipe?")) return;
    try {
      await fetch(`/api/recipes/${params.id}`, { method: "DELETE" });
      router.push("/");
    } catch {
      /* ignore */
    }
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
      {/* Hero image */}
      {recipe.image_url && (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Floating back / menu buttons */}
      <div
        className={`${recipe.image_url ? "absolute top-0 left-0 right-0" : ""} flex items-center justify-between p-4`}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-white shadow-md backdrop-blur-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-11 z-10 w-44 rounded-xl border border-border bg-card py-1 shadow-lg">
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 text-sm hover:bg-primary-light"
                >
                  View Original
                </a>
              )}
              <button
                onClick={handleDelete}
                className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Delete Recipe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-4 rounded-t-3xl bg-background px-5 pt-6">
        <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>

        {recipe.source_name && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            Source: {recipe.source_name}
          </a>
        )}

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
          {recipe.servings && (
            <ServingAdjuster servings={servings} onChange={setServings} />
          )}
        </div>

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
        {recipe.notes && (
          <section className="mt-8">
            <h2 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
              Notes
            </h2>
            <p className="px-2 text-sm leading-relaxed text-foreground/80">
              {recipe.notes}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
