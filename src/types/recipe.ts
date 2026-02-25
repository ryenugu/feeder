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
}
