import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedRecipe } from "@/types/recipe";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
};

const EXTRACTION_PROMPT = `Extract the recipe from this document. Return ONLY valid JSON with this exact structure, no other text:

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
- Extract ALL ingredients and ALL instructions
- Keep ingredient measurements and quantities exactly as written
- Each instruction step should be a separate string
- If a field is not found, use null
- For servings, extract just the number
- For times, use human-readable format like "30 min" or "1 hr 15 min"
- Return ONLY the JSON object, no markdown fences or extra text`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Document extraction is not configured. Missing API key." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or image (JPEG, PNG, WebP, GIF)." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const anthropic = new Anthropic({
      apiKey,
      baseURL: "https://api.anthropic.com",
    });

    const content: Anthropic.ContentBlockParam[] =
      fileType === "pdf"
        ? [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ]
        : [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: base64,
              },
            },
            { type: "text", text: EXTRACTION_PROMPT },
          ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    const recipe: ExtractedRecipe = {
      title: parsed.title || "Untitled Recipe",
      image_url: parsed.image_url || null,
      source_url: "uploaded-document",
      source_name: file.name,
      total_time: parsed.total_time || null,
      prep_time: parsed.prep_time || null,
      cook_time: parsed.cook_time || null,
      servings: typeof parsed.servings === "number" ? parsed.servings : null,
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
      notes: parsed.notes || null,
    };

    if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
      return NextResponse.json(
        { error: "Could not find recipe content in this document. Try a clearer image or PDF." },
        { status: 422 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Document extraction error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse recipe from document. Try a different file." },
        { status: 422 }
      );
    }

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
