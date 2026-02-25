/**
 * Seed script — deletes all recipes and re-adds them from the seed data.
 *
 *   npm run seed
 *
 * Requires local Supabase to be running (npx supabase start).
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { extractRecipe } from "../src/lib/recipe-scraper.js";
import { extractRecipeFromVideo } from "../src/lib/youtube.js";
import type { ExtractedRecipe } from "../src/types/recipe.js";
import { SEED_RECIPES, type SeedRecipe } from "./seed-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = "http://127.0.0.1:54321";
// Default local-dev service-role key (well-known / public)
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0." +
  "EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function loadEnvLocal() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found — continue with existing env
  }
}

// ---------------------------------------------------------------------------
// Document extraction (Spinach Daal images → recipe via Anthropic)
// ---------------------------------------------------------------------------

const EXTRACTION_PROMPT = `Extract the recipe from the provided content. All documents/images are pages of the SAME recipe. Combine information from all of them. Return ONLY valid JSON with this exact structure, no other text:

{
  "title": "Recipe title",
  "total_time": "total time or null",
  "prep_time": "prep time or null",
  "cook_time": "cook time or null",
  "servings": number or null,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "notes": "any notes or null"
}

Rules:
- Extract ALL ingredients and ALL instructions from ALL provided pages
- Keep ingredient measurements exactly as written
- Each instruction step should be a separate string
- If a field is not found, use null
- Return ONLY the JSON object, no markdown fences`;

async function uploadFixtureImages(
  supabase: ReturnType<typeof createClient<any>>,
  imagePaths: string[],
  userId: string
): Promise<string[]> {
  const sourceImages: string[] = [];
  for (const rel of imagePaths) {
    const abs = resolve(__dirname, rel);
    const buf = readFileSync(abs);
    const fileName = rel.split("/").pop()!;
    const storagePath = `${userId}/seed-${Date.now()}-${fileName}`;

    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(storagePath, buf, {
        contentType: "image/png",
        upsert: true,
      });
    if (error) {
      console.warn(`    ⚠ Failed to upload ${fileName}: ${error.message}`);
      continue;
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${storagePath}`;
    sourceImages.push(publicUrl);
  }
  return sourceImages;
}

async function extractFromImages(
  supabase: ReturnType<typeof createClient<any>>,
  imagePaths: string[],
  userId: string
): Promise<ExtractedRecipe> {
  const sourceImages = await uploadFixtureImages(supabase, imagePaths, userId);

  const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "  ⚠ FEEDER_ANTHROPIC_API_KEY not set — saving document as link only"
    );
    return {
      title: "Spinach Daal",
      image_url: null,
      source_url: "uploaded-document",
      source_name: imagePaths.map((p) => p.split("/").pop()).join(", "),
      total_time: null,
      prep_time: null,
      cook_time: null,
      servings: null,
      ingredients: [],
      instructions: [],
      notes: "Extracted from handwritten recipe images",
      source_images: sourceImages,
    };
  }

  const content: Anthropic.ContentBlockParam[] = [];
  for (const rel of imagePaths) {
    const abs = resolve(__dirname, rel);
    const buf = readFileSync(abs);
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: buf.toString("base64"),
      },
    });
  }
  content.push({ type: "text", text: EXTRACTION_PROMPT });

  const anthropic = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
  });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  let json = textBlock.text.trim();
  const fence = json.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) json = fence[1].trim();

  const parsed = JSON.parse(json);
  return {
    title: parsed.title || "Spinach Daal",
    image_url: null,
    source_url: "uploaded-document",
    source_name: imagePaths.map((p) => p.split("/").pop()).join(", "),
    total_time: parsed.total_time || null,
    prep_time: parsed.prep_time || null,
    cook_time: parsed.cook_time || null,
    servings: typeof parsed.servings === "number" ? parsed.servings : null,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
    notes: parsed.notes || "Extracted from handwritten recipe images",
    source_images: sourceImages,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLinkOnly(seed: SeedRecipe): ExtractedRecipe {
  let sourceName: string;
  try {
    sourceName = new URL(seed.url).hostname.replace(/^www\./, "");
  } catch {
    sourceName = seed.name;
  }
  return {
    title: seed.name,
    image_url: null,
    source_url: seed.url,
    source_name: sourceName,
    total_time: null,
    prep_time: null,
    cook_time: null,
    servings: null,
    ingredients: [],
    instructions: [],
    notes: null,
  };
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        msg.includes("overloaded") ||
        msg.includes("529") ||
        msg.includes("rate") ||
        msg.includes("timeout") ||
        msg.includes("onnection");
      if (retryable && attempt < retries) {
        const wait = (attempt + 1) * 5;
        console.warn(
          `    ⟳ Retry ${attempt + 1}/${retries} in ${wait}s — ${msg.slice(0, 60)}`
        );
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnvLocal();

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Find user — optionally target a specific email via CLI arg
  const targetEmail = process.argv[2];
  const { data } = await supabase.auth.admin.listUsers();
  const users = data?.users ?? [];
  if (users.length === 0) {
    console.error("No users found in local Supabase. Create one first.");
    process.exit(1);
  }
  const user = targetEmail
    ? users.find((u) => u.email === targetEmail)
    : users[0];
  if (!user) {
    console.error(`User ${targetEmail} not found.`);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`Seeding for ${user.email} (${userId})\n`);

  // Delete all existing recipes
  const { data: existing } = await supabase
    .from("recipes")
    .select("id")
    .eq("user_id", userId);

  if (existing && existing.length > 0) {
    console.log(`Deleting ${existing.length} existing recipe(s)…`);
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("user_id", userId);
    if (error) {
      console.error("Delete failed:", error.message);
      process.exit(1);
    }
  }

  // Seed each recipe
  let ok = 0;
  let failed = 0;

  for (const seed of SEED_RECIPES) {
    const tag = seed.type.toUpperCase().padEnd(9);
    process.stdout.write(`  [${tag}] ${seed.name}…`);
    try {
      let extracted: ExtractedRecipe;

      switch (seed.type) {
        case "url":
          extracted = await extractRecipe(seed.url);
          break;
        case "youtube":
          try {
            extracted = await withRetry(
              () => extractRecipeFromVideo(seed.url),
              seed.name
            );
          } catch {
            extracted = makeLinkOnly(seed);
          }
          break;
        case "document":
          extracted = await withRetry(
            () => extractFromImages(supabase, seed.imagePaths!, userId),
            seed.name
          );
          break;
        case "link-only":
        default:
          extracted = makeLinkOnly(seed);
          break;
      }

      const { error } = await supabase.from("recipes").insert({
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
        categories: [],
        tags: null,
        source_images: extracted.source_images ?? [],
      });

      if (error) throw new Error(error.message);

      const detail =
        extracted.ingredients.length > 0
          ? `${extracted.ingredients.length} ingredients, ${extracted.instructions.length} steps`
          : "link only";
      console.log(` ✓ "${extracted.title}" (${detail})`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(` ✗ FAILED — ${msg.slice(0, 80)}`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} added, ${failed} failed out of ${SEED_RECIPES.length} recipes.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
