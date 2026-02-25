import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { TasteProfile } from "./taste-profile";
import { profileToPromptContext } from "./taste-profile";

const suggestedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  reason: z.string(),
  tags: z.array(z.string()).default([]),
  prep_time: z.string().nullable(),
  cook_time: z.string().nullable(),
  total_time: z.string().nullable(),
  servings: z.number().nullable(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
});

const suggestionsResponseSchema = z.object({
  recipes: z.array(suggestedRecipeSchema),
});

export type SuggestedRecipe = z.infer<typeof suggestedRecipeSchema>;

const SYSTEM_PROMPT = `You are a personal recipe curator for a family. You analyze their saved recipe collection to understand their cooking style, ingredient preferences, and dietary patterns, then suggest new recipes they'd love.

Your suggestions should:
- Feel personalized — reference patterns you notice in their cooking
- Offer variety — mix quick weeknight meals with weekend projects, different cuisines and meal types
- Be practical — use ingredients that are commonly available
- Include complete recipes with precise measurements and clear instructions
- Avoid duplicating recipes they already have

Return ONLY valid JSON matching the requested schema. No markdown fences, no extra text.`;

function buildUserPrompt(profile: TasteProfile): string {
  const context = profileToPromptContext(profile);
  const titleList = profile.allTitles.map((t) => `- ${t}`).join("\n");

  return `Here's a summary of this family's recipe collection:

${context}

Their existing recipes (do NOT suggest duplicates or very similar dishes):
${titleList}

Generate exactly 6 new recipe suggestions. For each recipe, provide:
- title: A clear, appetizing recipe name
- description: 1-2 sentence description of the dish
- reason: A short, friendly explanation of why this matches their taste (e.g. "You love quick Italian dishes — this one's ready in 20 min")
- tags: Array of 1-3 short tags for the dish (e.g. ["Dinner", "Indian", "Quick"] or ["Breakfast", "Healthy"] or ["Snack", "Mexican"]). Always include the meal type (Breakfast/Lunch/Dinner/Snack) as the first tag, then optionally a cuisine or style tag.
- prep_time: Human-readable (e.g. "15 min") or null
- cook_time: Human-readable or null
- total_time: Human-readable or null
- servings: Number or null
- ingredients: Full list with quantities (e.g. "2 cups all-purpose flour")
- instructions: Step-by-step, each step a separate string

Aim for variety:
- At least one quick weeknight recipe (under 30 min)
- At least one recipe from a cuisine they seem to enjoy
- At least one recipe that introduces something slightly new but still approachable
- Mix of meal types (breakfast, lunch, dinner, snack)

Return a JSON object: { "recipes": [...] }`;
}

export async function generateSuggestions(
  profile: TasteProfile
): Promise<SuggestedRecipe[]> {
  const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Recipe suggestions are not configured. Missing API key.");
  }

  const anthropic = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(profile),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from AI");
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
    throw new Error("Failed to parse recipe suggestions from AI response.");
  }

  const validated = suggestionsResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Invalid suggestion format: ${validated.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  return validated.data.recipes;
}
