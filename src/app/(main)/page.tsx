import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Recipe } from "@/types/recipe";
import RecipeGrid from "@/components/RecipeGrid";

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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all active:scale-95 active:bg-primary/80"
          aria-label="Add recipe"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      </div>

      <RecipeGrid recipes={typedRecipes} />
    </div>
  );
}
