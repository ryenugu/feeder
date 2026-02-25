import { YoutubeTranscript } from "youtube-transcript";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedRecipe } from "@/types/recipe";

const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "m.youtube.com"
    );
  } catch {
    return false;
  }
}

export function extractVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export interface YouTubeVideoInfo {
  title: string;
  thumbnail: string;
  text: string;
  source: "transcript" | "description";
}

function extractDescriptionFromYtData($: cheerio.CheerioAPI): string | null {
  let result: string | null = null;
  $("script").each((_, el) => {
    const scriptContent = $(el).html() || "";
    if (!scriptContent.includes("ytInitialData")) return;
    const match = scriptContent.match(
      /var\s+ytInitialData\s*=\s*(\{[\s\S]+?\});/
    );
    if (!match) return;
    try {
      const data = JSON.parse(match[1]);
      const contents =
        data?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
      if (!Array.isArray(contents)) return;
      for (const item of contents) {
        const desc =
          item?.videoSecondaryInfoRenderer?.attributedDescription?.content;
        if (typeof desc === "string" && desc.length > 50) {
          result = desc;
          return false;
        }
        const descRuns =
          item?.videoSecondaryInfoRenderer?.description?.runs;
        if (Array.isArray(descRuns)) {
          const joined = descRuns
            .map((r: { text?: string }) => r.text || "")
            .join("");
          if (joined.length > 50) {
            result = joined;
            return false;
          }
        }
      }
    } catch {
      // JSON parse failed
    }
  });
  return result;
}

async function fetchVideoDescription(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // YouTube embeds description in meta tags and in the initial data script
    const metaDesc =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content");

    // Try to extract from the ytInitialData JSON embedded in the page
    const fullDescription = extractDescriptionFromYtData($);
    if (fullDescription && fullDescription.length > 100) {
      return fullDescription;
    }

    if (metaDesc && metaDesc.length > 50) {
      return metaDesc;
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchYouTubeVideoInfo(
  url: string
): Promise<YouTubeVideoInfo> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Could not extract video ID from URL");
  }

  let title = "YouTube Recipe";
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
    }
  } catch {
    // oEmbed failed, use fallback title
  }

  // Try transcript first: any language, then English specifically
  let transcript: string | null = null;
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (segments && segments.length > 0) {
      transcript = segments.map((s) => s.text).join(" ");
    }
  } catch {
    // No transcript in default language
  }

  if (!transcript) {
    try {
      const segments = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "en",
      });
      if (segments && segments.length > 0) {
        transcript = segments.map((s) => s.text).join(" ");
      }
    } catch {
      // No English transcript either
    }
  }

  if (transcript && transcript.length >= 50) {
    return {
      title,
      thumbnail: getYouTubeThumbnail(videoId),
      text: transcript,
      source: "transcript",
    };
  }

  // Fallback: extract recipe from the video description
  const description = await fetchVideoDescription(videoId);
  if (description && description.length >= 50) {
    return {
      title,
      thumbnail: getYouTubeThumbnail(videoId),
      text: description,
      source: "description",
    };
  }

  throw new Error(
    "No transcript or description available for this video. The recipe could not be extracted."
  );
}

const EXTRACTION_PROMPT_JSON = `Return ONLY valid JSON with this exact structure, no other text:

{
  "title": "Recipe title",
  "total_time": "total time or null",
  "prep_time": "prep time or null",
  "cook_time": "cook time or null",
  "servings": number or null,
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["step 1", "step 2", ...],
  "notes": "any useful tips mentioned or null"
}

Rules:
- Extract ALL ingredients with their measurements/quantities
- Write clear, concise instruction steps
- If exact quantities aren't mentioned, make reasonable estimates and note them
- Each instruction step should be a separate string
- If a field is not mentioned, use null
- For servings, extract just the number
- For times, use human-readable format like "30 min" or "1 hr 15 min"
- If the content doesn't appear to contain a recipe, return: {"error": "no_recipe"}
- Return ONLY the JSON object, no markdown fences or extra text`;

export async function extractRecipeFromVideo(
  url: string
): Promise<ExtractedRecipe> {
  const apiKey = process.env.FEEDER_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Video extraction is not configured. Missing API key.");
  }

  const videoInfo = await fetchYouTubeVideoInfo(url);
  const truncatedText = videoInfo.text.slice(0, 15000);

  const sourceLabel =
    videoInfo.source === "transcript"
      ? "transcript from a YouTube cooking video"
      : "description of a YouTube cooking video";

  const anthropic = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a recipe extraction expert. Below is the ${sourceLabel}. Extract the recipe into structured data.\n\nVideo title: "${videoInfo.title}"\n\n${videoInfo.source === "transcript" ? "Transcript" : "Description"}:\n${truncatedText}\n\n${EXTRACTION_PROMPT_JSON}`,
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
    throw new Error(
      "Failed to parse recipe from video. The video might not contain a clear recipe."
    );
  }

  if (parsed.error === "no_recipe") {
    throw new Error(
      "This video doesn't appear to contain a recipe. Try a cooking video instead."
    );
  }

  const recipe: ExtractedRecipe = {
    title: parsed.title || videoInfo.title,
    image_url: videoInfo.thumbnail,
    source_url: url,
    source_name: "youtube.com",
    total_time: parsed.total_time || null,
    prep_time: parsed.prep_time || null,
    cook_time: parsed.cook_time || null,
    servings: typeof parsed.servings === "number" ? parsed.servings : null,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    instructions: Array.isArray(parsed.instructions)
      ? parsed.instructions
      : [],
    notes: parsed.notes || null,
  };

  if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
    throw new Error(
      "Could not extract recipe details from this video."
    );
  }

  return recipe;
}
