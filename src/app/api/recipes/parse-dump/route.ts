import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function isUrl(text: string): boolean {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const PARSE_PROMPT = `You are a recipe extraction assistant. The user has pasted raw text that may be a recipe from any source — a webpage, blog post, cookbook scan, social media post, notes, or anything else.

Extract ALL recipe information and return it as a JSON object.

Rules:
- Return ONLY a valid JSON object, no other text or markdown
- If a field cannot be determined, use null (for strings/numbers) or [] (for arrays)
- title: the recipe name
- ingredients: array of strings, one ingredient per item with quantity and unit (e.g. "2 cups flour")
- instructions: array of strings, one step per item without step numbers (e.g. "Preheat oven to 350°F")
- prep_time: time to prepare before cooking — look for phrases like "prep time", "preparation time", "prep:", or infer from context. Format as "15 min", "1 hr", etc.
- cook_time: active cooking/baking time — look for "cook time", "bake time", "cooking time", or similar. Format as "30 min", "1 hr 15 min", etc.
- total_time: total time from start to finish — if explicitly stated use it, otherwise add prep_time + cook_time. Format the same way.
- servings: integer number of servings/portions, or null if not mentioned
- source_name: the website name, blog name, author name, or cookbook title if detectable, otherwise null

Return this exact shape:
{
  "title": string,
  "source_url": "pasted-text",
  "source_name": string | null,
  "image_url": null,
  "total_time": string | null,
  "prep_time": string | null,
  "cook_time": string | null,
  "servings": number | null,
  "ingredients": string[],
  "instructions": string[]
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI parsing is not configured." },
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

    let body: { text: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { text } = body;
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // If it's a plain URL, delegate to the existing extract endpoint
    if (isUrl(text)) {
      const extractRes = await fetch(
        new URL("/api/recipes/extract", request.url),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || "",
          },
          body: JSON.stringify({ url: text.trim() }),
        }
      );
      const extractData = await extractRes.json();
      if (!extractRes.ok) {
        return NextResponse.json(extractData, { status: extractRes.status });
      }
      return NextResponse.json(extractData);
    }

    // Otherwise use Claude to parse the raw text
    const anthropic = new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${PARSE_PROMPT}\n\nText to parse:\n${text}`,
          },
        ],
      });
    } catch {
      return NextResponse.json(
        { error: "AI parsing failed. Please try again." },
        { status: 502 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    let recipe: unknown;
    try {
      recipe = JSON.parse(jsonStr);
      if (typeof recipe !== "object" || recipe === null || Array.isArray(recipe)) {
        throw new Error("Not an object");
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 422 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Parse dump error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
