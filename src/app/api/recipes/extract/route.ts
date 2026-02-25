import { NextRequest, NextResponse } from "next/server";
import { extractRecipe } from "@/lib/recipe-scraper";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
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
