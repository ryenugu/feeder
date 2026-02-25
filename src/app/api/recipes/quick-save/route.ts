import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRecipe } from "@/lib/recipe-scraper";
import { createApiKeyClient } from "@/lib/supabase/api-key";

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const result = await createApiKeyClient(apiKey);
    if (result) {
      userId = result.userId;
    }
  }

  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id || null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Provide a valid session or x-api-key header." }, { status: 401 });
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let recipeData;
    try {
      const extracted = await extractRecipe(url);
      recipeData = {
        user_id: userId,
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
      };
    } catch {
      let hostname: string | null = null;
      try { hostname = new URL(url).hostname.replace(/^www\./, ""); } catch { /* invalid url */ }
      recipeData = {
        user_id: userId,
        title: hostname || url,
        image_url: null,
        source_url: url,
        source_name: hostname,
        total_time: null,
        prep_time: null,
        cook_time: null,
        servings: null,
        ingredients: [],
        instructions: [],
        notes: null,
      };
    }

    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("recipes")
      .insert(recipeData)
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
