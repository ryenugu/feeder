import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SuggestionRecipeData } from "@/types/recipe";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status: "saved" | "dismissed" };

  if (!["saved", "dismissed"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be 'saved' or 'dismissed'" },
      { status: 400 }
    );
  }

  const { data: suggestion, error: fetchErr } = await supabase
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !suggestion) {
    return NextResponse.json(
      { error: "Suggestion not found" },
      { status: 404 }
    );
  }

  if (status === "saved") {
    const recipeData = suggestion.recipe_data as SuggestionRecipeData;

    const { data: recipe, error: recipeErr } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: recipeData.title,
        image_url: null,
        source_url: "ai-suggestion",
        source_name: "AI Suggestion",
        total_time: recipeData.total_time,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        notes: recipeData.description,
        tags: ["ai-suggested", ...(recipeData.tags || [])],
        categories: ["New Ideas"],
        source_images: [],
      })
      .select()
      .single();

    if (recipeErr) {
      return NextResponse.json({ error: recipeErr.message }, { status: 500 });
    }

    await supabase
      .from("suggestions")
      .update({ status: "saved" })
      .eq("id", id);

    revalidatePath("/");
    return NextResponse.json({ status: "saved", recipe });
  }

  const { error: updateErr } = await supabase
    .from("suggestions")
    .update({ status: "dismissed" })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: "dismissed" });
}
