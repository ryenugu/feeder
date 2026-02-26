import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const PROMPTS = {
  instructions: `You are formatting recipe instructions. The user pasted raw text that may be a wall of text, numbered steps run together, or messy formatting. 
  
Split it into clean, individual instruction steps. Each step should be one clear action.

Rules:
- Return ONLY a JSON array of strings, no other text
- Each string is one step (do NOT include step numbers like "1." or "Step 1:")
- Remove redundant whitespace
- If text is already one-step-per-line, still clean it up but preserve the structure
- Do not add steps that weren't in the original
- Example output: ["Preheat oven to 350°F", "Mix flour and sugar", "Bake for 30 minutes"]`,

  ingredients: `You are formatting recipe ingredients. The user pasted raw text that may be a wall of text, comma-separated, or messily formatted.

Split it into clean, individual ingredient lines. Each line should be one ingredient with its quantity and unit.

Rules:
- Return ONLY a JSON array of strings, no other text
- Each string is one ingredient (e.g. "2 cups flour", "1 tsp salt")
- Remove redundant whitespace and bullets/dashes
- Preserve quantities and units exactly as written
- If text is already one-ingredient-per-line, still clean it up
- Do not add ingredients that weren't in the original
- Example output: ["2 cups all-purpose flour", "1 tsp baking soda", "3 large eggs"]`,
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI formatting is not configured." },
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

    let body: { text: string; field: "instructions" | "ingredients" };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { text, field } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (field !== "instructions" && field !== "ingredients") {
      return NextResponse.json({ error: "Invalid field type" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `${PROMPTS[field]}\n\nText to format:\n${text}`,
          },
        ],
      });
    } catch {
      return NextResponse.json(
        { error: "AI formatting failed. Please try again." },
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

    let lines: string[];
    try {
      lines = JSON.parse(jsonStr);
      if (!Array.isArray(lines)) throw new Error("Not an array");
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 422 }
      );
    }

    return NextResponse.json({ lines: lines.filter((l) => typeof l === "string" && l.trim()) });
  } catch (error) {
    console.error("Format text error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
