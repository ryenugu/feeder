export const RECIPE_CATEGORIES = [
  "Go-to Recipes",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "New Ideas",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  image_url: string | null;
  source_url: string;
  source_name: string | null;
  total_time: string | null;
  prep_time: string | null;
  cook_time: string | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  tags: string[] | null;
  categories: RecipeCategory[];
  source_images: string[];
  created_at: string;
}

export interface MealPlanEntry {
  id: string;
  user_id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  created_at: string;
  recipe?: Recipe;
}

export interface ExtractedRecipe {
  title: string;
  image_url: string | null;
  source_url: string;
  source_name: string | null;
  total_time: string | null;
  prep_time: string | null;
  cook_time: string | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  source_images?: string[];
}

export interface SuggestionRecipeData {
  title: string;
  description: string;
  reason: string;
  tags: string[];
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
}

export interface Suggestion {
  id: string;
  user_id: string;
  recipe_data: SuggestionRecipeData;
  reason: string;
  status: "active" | "saved" | "dismissed";
  batch_id: string;
  created_at: string;
}
