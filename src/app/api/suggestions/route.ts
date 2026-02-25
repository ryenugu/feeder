import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import type { Suggestion } from "@/types/recipe";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: suggestions, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Suggestions query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count: recipeCount } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      suggestions: (suggestions || []) as Suggestion[],
      canGenerate: (recipeCount || 0) >= 3 && isAdmin(user.email),
      recipeCount: recipeCount || 0,
      isAdmin: isAdmin(user.email),
    });
  } catch (err) {
    console.error("Suggestions API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
