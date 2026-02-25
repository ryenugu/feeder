import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTasteProfile } from "@/lib/taste-profile";
import { generateSuggestions } from "@/lib/suggestions";
import { isAdmin } from "@/lib/admin";
import type { Recipe, MealPlanEntry } from "@/types/recipe";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(user.email)) {
    return NextResponse.json(
      { error: "Only admins can generate AI suggestions." },
      { status: 403 }
    );
  }

  const { data: recipes, error: recipesErr } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id);

  if (recipesErr) {
    return NextResponse.json({ error: recipesErr.message }, { status: 500 });
  }

  const typedRecipes = (recipes || []) as Recipe[];

  if (typedRecipes.length < 3) {
    return NextResponse.json(
      { error: "Save at least 3 recipes before generating suggestions." },
      { status: 400 }
    );
  }

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id);

  const typedPlans = (mealPlans || []) as MealPlanEntry[];

  const profile = buildTasteProfile(typedRecipes, typedPlans);
  const suggestedRecipes = await generateSuggestions(profile);

  await supabase
    .from("suggestions")
    .update({ status: "dismissed" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const batchId = crypto.randomUUID();

  const rows = suggestedRecipes.map((recipe) => ({
    user_id: user.id,
    recipe_data: recipe,
    reason: recipe.reason,
    status: "active",
    batch_id: batchId,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("suggestions")
    .insert(rows)
    .select("*");

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ suggestions: inserted });
}
