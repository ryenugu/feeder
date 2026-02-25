import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedRecipe } from "@/types/recipe";

export const maxDuration = 60;

const MEDIA_TYPE_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
};

const EXTRACTION_PROMPT = `Extract the recipe from the provided content. All documents/images are pages of the SAME recipe. Combine information from all of them. Return ONLY valid JSON with this exact structure, no other text:

{
  "title": "Recipe title",
  "image_url": null,
  "total_time": "total time or null",
  "prep_time": "prep time or null",
  "cook_time": "cook time or null",
  "servings": number or null,
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "notes": "any notes from the document or null"
}

Rules:
- Extract ALL ingredients and ALL instructions from ALL provided pages
- Keep ingredient measurements and quantities exactly as written
- Each instruction step should be a separate string
- If a field is not found, use null
- For servings, extract just the number
- For times, use human-readable format like "30 min" or "1 hr 15 min"
- Return ONLY the JSON object, no markdown fences or extra text`;

function buildContentBlock(
  mediaType: string,
  base64: string
): Anthropic.ContentBlockParam {
  if (mediaType === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    };
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif",
      data: base64,
    },
  };
}

interface ExtractionRequest {
  storage_paths: string[];
  file_types: string[];
  file_names: string[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Document extraction is not configured. Missing API key." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: ExtractionRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const { storage_paths, file_types, file_names } = body;

    if (!storage_paths?.length || !file_types?.length || !file_names?.length) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (storage_paths.length > 10) {
      return NextResponse.json(
        { error: "Too many files. Maximum is 10." },
        { status: 400 }
      );
    }

    for (const type of file_types) {
      if (!MEDIA_TYPE_MAP[type]) {
        return NextResponse.json(
          { error: `Unsupported file type: ${type}` },
          { status: 400 }
        );
      }
    }

    const content: Anthropic.ContentBlockParam[] = [];

    for (let i = 0; i < storage_paths.length; i++) {
      const { data, error } = await supabase.storage
        .from("recipe-images")
        .download(storage_paths[i]);

      if (error || !data) {
        console.error("Storage download error:", error);
        return NextResponse.json(
          { error: `Failed to read uploaded file: ${file_names[i]}` },
          { status: 500 }
        );
      }

      const buffer = await data.arrayBuffer();
      if (buffer.byteLength === 0) {
        return NextResponse.json(
          { error: `Uploaded file is empty: ${file_names[i]}` },
          { status: 400 }
        );
      }

      const base64 = Buffer.from(buffer).toString("base64");
      content.push(buildContentBlock(file_types[i], base64));
    }

    content.push({ type: "text", text: EXTRACTION_PROMPT });

    const anthropic = new Anthropic({
      apiKey,
      baseURL: "https://api.anthropic.com",
    });

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      });
    } catch (apiErr) {
      console.error("Anthropic API error:", apiErr);
      return NextResponse.json(
        { error: "AI extraction failed. Please try again." },
        { status: 502 }
      );
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 502 }
      );
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse recipe from document. Try a different file." },
        { status: 422 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sourceImages = storage_paths.map(
      (p) =>
        `${supabaseUrl}/storage/v1/object/public/recipe-images/${p.split("/").map(encodeURIComponent).join("/")}`
    );

    let imageUrl: string | null = null;
    if (parsed.image_url) {
      try {
        new URL(parsed.image_url);
        imageUrl = parsed.image_url;
      } catch {
        imageUrl = null;
      }
    }

    const recipe: ExtractedRecipe = {
      title: parsed.title || "Untitled Recipe",
      image_url: imageUrl,
      source_url: "uploaded-document",
      source_name: file_names.join(", "),
      total_time: parsed.total_time || null,
      prep_time: parsed.prep_time || null,
      cook_time: parsed.cook_time || null,
      servings: typeof parsed.servings === "number" ? parsed.servings : null,
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      instructions: Array.isArray(parsed.instructions)
        ? parsed.instructions
        : [],
      notes: parsed.notes || null,
      source_images: sourceImages,
    };

    if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not find recipe content in the uploaded documents. Try clearer images or PDFs.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Document extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract recipe from document",
      },
      { status: 500 }
    );
  }
}
