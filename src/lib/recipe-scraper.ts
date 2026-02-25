import * as cheerio from "cheerio";
import { execFile } from "child_process";
import { promisify } from "util";
import type { ExtractedRecipe } from "@/types/recipe";

const execFileAsync = promisify(execFile);

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
      .map((s) => s.replace(/<[^>]*>/g, "").trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    const result: string[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        result.push(item.replace(/<[^>]*>/g, "").trim());
      } else if (item && typeof item === "object") {
        if (
          item["@type"] === "HowToSection" &&
          Array.isArray(item.itemListElement)
        ) {
          if (item.name) result.push(`**${item.name}**`);
          for (const sub of item.itemListElement) {
            if (typeof sub === "string")
              result.push(sub.replace(/<[^>]*>/g, "").trim());
            else if (sub?.text)
              result.push(sub.text.replace(/<[^>]*>/g, "").trim());
          }
        } else if (item.text) {
          result.push(item.text.replace(/<[^>]*>/g, "").trim());
        } else if (item.name) {
          result.push(item.name.replace(/<[^>]*>/g, "").trim());
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
    const type = data["@type"];
    if (
      type === "Recipe" ||
      (Array.isArray(type) && type.includes("Recipe"))
    ) {
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
    ? recipe.recipeIngredient.map((i: string) =>
        String(i).replace(/<[^>]*>/g, "").trim()
      )
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

const INGREDIENT_SELECTORS = [
  '[class*="ingredient"] li',
  '[class*="ingredient"] p',
  '[data-testid*="ingredient"] li',
  '[itemprop="recipeIngredient"]',
  ".recipe-ingredients li",
  ".ingredients-list li",
  ".ingredient-list li",
  ".wprm-recipe-ingredient",
  ".tasty-recipe-ingredients li",
  ".mv-create-ingredients li",
];

const INSTRUCTION_SELECTORS = [
  '[class*="instruction"] li',
  '[class*="instruction"] p',
  '[class*="direction"] li',
  '[class*="direction"] p',
  '[class*="step"] li',
  '[class*="step"] p',
  '[data-testid*="instruction"] li',
  '[itemprop="recipeInstructions"] li',
  '[itemprop="recipeInstructions"] p',
  ".recipe-directions li",
  ".recipe-steps li",
  ".wprm-recipe-instruction",
  ".tasty-recipe-instructions li",
  ".mv-create-instructions li",
];

const TIME_SELECTORS = [
  '[class*="total-time"]',
  '[class*="totalTime"]',
  '[class*="cook-time"]',
  '[class*="prep-time"]',
  ".wprm-recipe-total-time-container",
  '[itemprop="totalTime"]',
  '[itemprop="cookTime"]',
  '[itemprop="prepTime"]',
];

const SERVINGS_SELECTORS = [
  '[class*="servings"]',
  '[class*="yield"]',
  '[itemprop="recipeYield"]',
  ".wprm-recipe-servings",
];

function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractFromHtml(
  $: cheerio.CheerioAPI,
  url: string
): ExtractedRecipe {
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("h2").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled Recipe";

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('img[class*="recipe"]').first().attr("src") ||
    $("article img").first().attr("src") ||
    null;

  const ingredients: string[] = [];
  for (const selector of INGREDIENT_SELECTORS) {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 3 && text.length < 300) {
        ingredients.push(text);
      }
    });
    if (ingredients.length > 0) break;
  }

  if (ingredients.length === 0) {
    $("ul li").each((_, el) => {
      const text = cleanText($(el).text());
      if (
        text.length > 5 &&
        text.length < 300 &&
        /\d/.test(text) &&
        (text.includes("cup") ||
          text.includes("tsp") ||
          text.includes("tbsp") ||
          text.includes("oz") ||
          text.includes("lb") ||
          text.includes("g ") ||
          text.includes("ml") ||
          text.includes("tablespoon") ||
          text.includes("teaspoon"))
      ) {
        ingredients.push(text);
      }
    });
  }

  const instructions: string[] = [];
  for (const selector of INSTRUCTION_SELECTORS) {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 15) {
        instructions.push(text);
      }
    });
    if (instructions.length > 0) break;
  }

  if (instructions.length === 0) {
    $("ol li").each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 15) {
        instructions.push(text);
      }
    });
  }

  let totalTime: string | null = null;
  for (const selector of TIME_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      const timeContent = el.attr("content") || el.text().trim();
      totalTime = parseISODuration(timeContent) || timeContent || null;
      if (totalTime) break;
    }
  }

  let servings: number | null = null;
  for (const selector of SERVINGS_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.attr("content") || el.text();
      const match = text?.match(/(\d+)/);
      if (match) {
        servings = parseInt(match[1]);
        break;
      }
    }
  }

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  return {
    title,
    image_url: image,
    source_url: url,
    source_name: extractHostname(url),
    total_time: totalTime,
    prep_time: null,
    cook_time: null,
    servings,
    ingredients: ingredients.slice(0, 50),
    instructions: instructions.slice(0, 30),
    notes: description,
  };
}

function isCloudflareChallenge(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    (lower.includes("just a moment") || lower.includes("checking your browser")) &&
    (lower.includes("cloudflare") || lower.includes("cf-browser-verification") ||
     lower.includes("cf_clearance") || lower.includes("challenge-platform"))
  );
}

async function fetchFromWaybackMachine(url: string): Promise<string | null> {
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=1&fl=timestamp&sort=reverse`;
    const cdxRes = await fetch(cdxUrl, { signal: AbortSignal.timeout(8000) });
    if (!cdxRes.ok) return null;

    const rows = await cdxRes.json() as string[][];
    if (rows.length < 2) return null;
    const timestamp = rows[1][0];

    const archiveUrl = `https://web.archive.org/web/${timestamp}id_/${url}`;
    const archiveRes = await fetch(archiveUrl, {
      signal: AbortSignal.timeout(12000),
      headers: { "Accept": "text/html" },
    });
    if (!archiveRes.ok) return null;

    const html = await archiveRes.text();
    if (!html || html.length < 500) return null;
    return html;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };

  let html: string | null = null;

  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) html = await response.text();
  } catch {
    // Node fetch failed — fall through to curl
  }

  if (!html) {
    try {
      const { stdout } = await execFileAsync("curl", [
        "-sS",
        "-L",
        "--max-time",
        "15",
        "--compressed",
        "-H",
        "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "-H",
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        "-H",
        "Referer: https://www.google.com/",
        url,
      ], { maxBuffer: 10 * 1024 * 1024 });

      if (stdout && stdout.length >= 100) html = stdout;
    } catch {
      // curl unavailable or failed — continue to fallbacks
    }
  }

  if (html && !isCloudflareChallenge(html)) {
    return html;
  }

  console.log(`Cloudflare challenge detected for ${url}, trying fallbacks…`);

  const scraperApiKey = process.env.SCRAPER_API_KEY;
  if (scraperApiKey) {
    try {
      const apiUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=true`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        const scraperHtml = await res.text();
        if (scraperHtml && scraperHtml.length > 500 && !isCloudflareChallenge(scraperHtml)) {
          return scraperHtml;
        }
      }
    } catch {
      // ScraperAPI failed — continue to Wayback Machine
    }
  }

  const waybackHtml = await fetchFromWaybackMachine(url);
  if (waybackHtml && !isCloudflareChallenge(waybackHtml)) {
    return waybackHtml;
  }

  throw new Error(
    "This site's bot protection blocked the request. Try pasting the recipe ingredients and instructions manually instead."
  );
}

export async function extractRecipe(url: string): Promise<ExtractedRecipe> {
  const html = await fetchHtml(url);
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
