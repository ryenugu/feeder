import * as cheerio from "cheerio";
import type { ExtractedRecipe } from "@/types/recipe";

function parseISODuration(duration: string | undefined | null): string | null {
  if (!duration || typeof duration !== "string") return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.length > 0 ? parts.join(" ") : null;
}

function extractHostname(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return null;
  }
}

function extractInstructions(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    return raw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    const result: string[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        result.push(item.trim());
      } else if (item && typeof item === "object") {
        if (item["@type"] === "HowToSection" && Array.isArray(item.itemListElement)) {
          for (const sub of item.itemListElement) {
            if (typeof sub === "string") result.push(sub.trim());
            else if (sub?.text) result.push(sub.text.trim());
          }
        } else if (item.text) {
          result.push(item.text.trim());
        }
      }
    }
    return result.filter(Boolean);
  }
  return [];
}

function parseServings(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const match = raw.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return parseServings(raw[0]);
  }
  return null;
}

function extractImage(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    return typeof raw[0] === "string" ? raw[0] : raw[0]?.url || null;
  }
  if (raw && typeof raw === "object" && "url" in raw) {
    return (raw as { url: string }).url;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findRecipeInJsonLd(data: any): any | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof data === "object") {
    if (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe"))) {
      return data;
    }
    if (data["@graph"] && Array.isArray(data["@graph"])) {
      return findRecipeInJsonLd(data["@graph"]);
    }
  }

  return null;
}

function normalizeJsonLdRecipe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recipe: any,
  url: string
): ExtractedRecipe {
  const ingredients: string[] = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.map((i: string) => i.trim())
    : [];

  return {
    title: recipe.name || "Untitled Recipe",
    image_url: extractImage(recipe.image),
    source_url: url,
    source_name: extractHostname(url),
    total_time: parseISODuration(recipe.totalTime),
    prep_time: parseISODuration(recipe.prepTime),
    cook_time: parseISODuration(recipe.cookTime),
    servings: parseServings(recipe.recipeYield),
    ingredients,
    instructions: extractInstructions(recipe.recipeInstructions),
    notes: recipe.description || null,
  };
}

function extractFromHtml(
  $: cheerio.CheerioAPI,
  url: string
): ExtractedRecipe {
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Untitled Recipe";
  const image =
    $('meta[property="og:image"]').attr("content") || null;

  const ingredients: string[] = [];
  $("ul li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 5 && text.length < 300) {
      ingredients.push(text);
    }
  });

  const instructions: string[] = [];
  $("ol li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) {
      instructions.push(text);
    }
  });

  return {
    title,
    image_url: image,
    source_url: url,
    source_name: extractHostname(url),
    total_time: null,
    prep_time: null,
    cook_time: null,
    servings: null,
    ingredients: ingredients.slice(0, 50),
    instructions: instructions.slice(0, 30),
    notes: null,
  };
}

export async function extractRecipe(url: string): Promise<ExtractedRecipe> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const raw = $(jsonLdScripts[i]).html();
      if (!raw) continue;
      const data = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(data);
      if (recipe) {
        return normalizeJsonLdRecipe(recipe, url);
      }
    } catch {
      continue;
    }
  }

  return extractFromHtml($, url);
}
