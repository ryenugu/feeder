import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipe } from "@/lib/recipe-scraper";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const extracted = await extractRecipe(url);

    const { data, error } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: extracted.title,
        image_url: extracted.image_url,
        source_url: extracted.source_url,
        source_name: extracted.source_name,
        total_time: extracted.total_time,
        prep_time: extracted.prep_time,
        cook_time: extracted.cook_time,
        servings: extracted.servings,
        ingredients: extracted.ingredients,
        instructions: extracted.instructions,
        notes: extracted.notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Quick save error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save recipe",
      },
      { status: 500 }
    );
  }
}
