import { z } from "zod";

export const recipeCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  image_url: z.string().url().nullable().optional(),
  source_url: z.string().min(1, "Source is required"),
  source_name: z.string().nullable().optional(),
  total_time: z.string().nullable().optional(),
  prep_time: z.string().nullable().optional(),
  cook_time: z.string().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  ingredients: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  categories: z
    .array(
      z.enum([
        "Go-to Recipes",
        "Breakfast",
        "Lunch",
        "Dinner",
        "Snacks",
        "New Ideas",
      ])
    )
    .default([]),
  source_images: z.array(z.string().url()).default([]),
});

export const recipeUpdateSchema = recipeCreateSchema.partial();

export const mealPlanCreateSchema = z.object({
  recipe_id: z.string().uuid("Invalid recipe ID"),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export const extractUrlSchema = z.object({
  url: z.string().url("Invalid URL"),
});

export const groceryStoreCreateSchema = z.object({
  name: z.string().min(1, "Store name is required").max(200),
  sort_order: z.number().int().default(0),
});

export const groceryStoreUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  sort_order: z.number().int().optional(),
});

export const groceryItemCreateSchema = z.object({
  store_id: z.string().uuid("Invalid store ID"),
  name: z.string().min(1, "Item name is required").max(500),
  sort_order: z.number().int().default(0),
});

export const groceryItemUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(500).optional(),
  checked: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["created_at", "title", "total_time"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  category: z.string().optional(),
});
