import { NextRequest, NextResponse } from "next/server";
import { extractRecipe } from "@/lib/recipe-scraper";
import { extractUrlSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = extractUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid URL" },
        { status: 400 }
      );
    }

    const parsedUrl = new URL(parsed.data.url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Invalid protocol" },
        { status: 400 }
      );
    }

    const recipe = await extractRecipe(parsedUrl.toString());
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract recipe",
      },
      { status: 500 }
    );
  }
}
