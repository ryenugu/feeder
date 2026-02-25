import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/RecipeCard";
import Link from "next/link";
import type { Recipe } from "@/types/recipe";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  const typedRecipes = (recipes || []) as Recipe[];

  return (
    <div className="px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">feeder</h1>
        <Link
          href="/add"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-colors hover:bg-primary/90"
          aria-label="Add recipe"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      </div>

      {typedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
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
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {typedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
