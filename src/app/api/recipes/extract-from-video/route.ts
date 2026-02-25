import { NextRequest, NextResponse } from "next/server";
import { extractRecipeFromVideo, extractVideoId } from "@/lib/youtube";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let body: { url: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { url } = body;
    if (!url || !extractVideoId(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const recipe = await extractRecipeFromVideo(url);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Video extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract recipe from video",
      },
      { status: 500 }
    );
  }
}
