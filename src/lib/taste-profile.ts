import type { Recipe, MealPlanEntry } from "@/types/recipe";

export interface TasteProfile {
  topIngredients: { name: string; count: number }[];
  categoryDistribution: Record<string, number>;
  tags: string[];
  cuisineSignals: string[];
  avgCookingMinutes: number | null;
  commonServings: number | null;
  totalRecipes: number;
  mostPlannedTitles: string[];
  allTitles: string[];
}

const CUISINE_MARKERS: Record<string, string[]> = {
  Italian: ["parmesan", "mozzarella", "basil", "oregano", "marinara", "pasta", "risotto", "prosciutto", "pancetta"],
  Mexican: ["cumin", "cilantro", "jalapeño", "jalapeno", "chipotle", "tortilla", "salsa", "avocado", "lime", "chili powder"],
  Asian: ["soy sauce", "ginger", "sesame", "rice vinegar", "sriracha", "fish sauce", "hoisin", "miso", "tofu", "bok choy"],
  Indian: ["turmeric", "garam masala", "curry", "cardamom", "coriander", "naan", "ghee", "cumin", "chana"],
  Mediterranean: ["olive oil", "feta", "hummus", "tahini", "za'atar", "sumac", "pita", "chickpea", "lemon"],
  Thai: ["coconut milk", "lemongrass", "thai basil", "fish sauce", "galangal", "curry paste", "peanut"],
  Japanese: ["miso", "dashi", "nori", "wasabi", "mirin", "sake", "sushi", "edamame", "teriyaki"],
  French: ["butter", "shallot", "thyme", "dijon", "wine", "crème", "béchamel", "brioche"],
  Korean: ["gochujang", "kimchi", "sesame oil", "doenjang", "bulgogi", "bibimbap"],
  MiddleEastern: ["sumac", "za'atar", "pomegranate", "tahini", "harissa", "saffron", "rosewater"],
};

function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const lower = time.toLowerCase();
  let total = 0;
  const hrMatch = lower.match(/(\d+)\s*h/);
  const minMatch = lower.match(/(\d+)\s*m/);
  if (hrMatch) total += parseInt(hrMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  if (total === 0) {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) total = parseInt(numMatch[1]);
  }
  return total > 0 ? total : null;
}

function normalizeIngredient(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^[\d\s/.¼½¾⅓⅔⅛⅜⅝⅞]+/, "")
    .replace(/\b(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|ounces?|oz|lbs?|pounds?|grams?|g|ml|liters?|l|pinch(es)?|dash(es)?|bunch(es)?|cloves?|cans?|packages?|pieces?|slices?|large|medium|small|fresh|dried|ground|chopped|minced|diced|sliced|whole|thin(ly)?|fine(ly)?|roughly|to taste|optional|about|approximately|heaping)\b/g, "")
    .replace(/[(),]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTasteProfile(
  recipes: Recipe[],
  mealPlans: MealPlanEntry[]
): TasteProfile {
  const ingredientCounts = new Map<string, number>();
  const categoryCounts: Record<string, number> = {};
  const tagSet = new Set<string>();
  const times: number[] = [];
  const servings: number[] = [];

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients || []) {
      const normalized = normalizeIngredient(ing);
      if (normalized.length > 1 && normalized.length < 60) {
        ingredientCounts.set(normalized, (ingredientCounts.get(normalized) || 0) + 1);
      }
    }

    for (const cat of recipe.categories || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    for (const tag of recipe.tags || []) {
      tagSet.add(tag.toLowerCase());
    }

    const mins = parseTimeToMinutes(recipe.total_time)
      ?? parseTimeToMinutes(recipe.cook_time);
    if (mins) times.push(mins);

    if (recipe.servings) servings.push(recipe.servings);
  }

  const topIngredients = [...ingredientCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([name, count]) => ({ name, count }));

  const allIngredientText = [...ingredientCounts.keys()].join(" ");
  const cuisineSignals: string[] = [];
  for (const [cuisine, markers] of Object.entries(CUISINE_MARKERS)) {
    const hits = markers.filter((m) => allIngredientText.includes(m)).length;
    if (hits >= 2) cuisineSignals.push(cuisine);
  }

  const avgCookingMinutes =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;

  const commonServings =
    servings.length > 0
      ? Math.round(servings.reduce((a, b) => a + b, 0) / servings.length)
      : null;

  const planCounts = new Map<string, number>();
  for (const plan of mealPlans) {
    planCounts.set(plan.recipe_id, (planCounts.get(plan.recipe_id) || 0) + 1);
  }
  const mostPlannedIds = [...planCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const mostPlannedTitles = mostPlannedIds
    .map((id) => recipeById.get(id)?.title)
    .filter((t): t is string => !!t);

  return {
    topIngredients,
    categoryDistribution: categoryCounts,
    tags: [...tagSet],
    cuisineSignals,
    avgCookingMinutes,
    commonServings,
    totalRecipes: recipes.length,
    mostPlannedTitles,
    allTitles: recipes.map((r) => r.title),
  };
}

export function profileToPromptContext(profile: TasteProfile): string {
  const lines: string[] = [];

  lines.push(`Total recipes saved: ${profile.totalRecipes}`);

  if (profile.topIngredients.length > 0) {
    const ingList = profile.topIngredients
      .slice(0, 15)
      .map((i) => `${i.name} (${i.count}x)`)
      .join(", ");
    lines.push(`Most-used ingredients: ${ingList}`);
  }

  const catEntries = Object.entries(profile.categoryDistribution);
  if (catEntries.length > 0) {
    const catList = catEntries
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => `${cat}: ${n}`)
      .join(", ");
    lines.push(`Category breakdown: ${catList}`);
  }

  if (profile.cuisineSignals.length > 0) {
    lines.push(`Cuisine leanings: ${profile.cuisineSignals.join(", ")}`);
  }

  if (profile.tags.length > 0) {
    lines.push(`Tags used: ${profile.tags.slice(0, 20).join(", ")}`);
  }

  if (profile.avgCookingMinutes) {
    lines.push(`Average cooking time: ~${profile.avgCookingMinutes} minutes`);
  }

  if (profile.commonServings) {
    lines.push(`Typical servings: ${profile.commonServings}`);
  }

  if (profile.mostPlannedTitles.length > 0) {
    lines.push(`Most meal-planned recipes (true favorites): ${profile.mostPlannedTitles.join(", ")}`);
  }

  return lines.join("\n");
}
