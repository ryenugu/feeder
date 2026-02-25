import { describe, it, expect } from "vitest";
import {
  recipeCreateSchema,
  recipeUpdateSchema,
  mealPlanCreateSchema,
  extractUrlSchema,
} from "@/lib/validations";

describe("recipeCreateSchema", () => {
  it("accepts a valid recipe", () => {
    const result = recipeCreateSchema.safeParse({
      title: "Pasta Carbonara",
      source_url: "https://example.com/pasta",
      ingredients: ["spaghetti", "eggs", "bacon"],
      instructions: ["Cook pasta", "Mix eggs"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = recipeCreateSchema.safeParse({
      source_url: "https://example.com",
      ingredients: [],
      instructions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = recipeCreateSchema.safeParse({
      title: "",
      source_url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source_url", () => {
    const result = recipeCreateSchema.safeParse({
      title: "Test",
      source_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid categories", () => {
    const result = recipeCreateSchema.safeParse({
      title: "Test",
      source_url: "https://example.com",
      categories: ["Breakfast", "Dinner"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid categories", () => {
    const result = recipeCreateSchema.safeParse({
      title: "Test",
      source_url: "https://example.com",
      categories: ["InvalidCategory"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable fields", () => {
    const result = recipeCreateSchema.safeParse({
      title: "Test",
      source_url: "https://example.com",
      image_url: null,
      notes: null,
      tags: null,
      servings: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("recipeUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = recipeUpdateSchema.safeParse({
      title: "Updated Title",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = recipeUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid types in partial update", () => {
    const result = recipeUpdateSchema.safeParse({
      servings: "not a number",
    });
    expect(result.success).toBe(false);
  });
});

describe("mealPlanCreateSchema", () => {
  it("accepts a valid meal plan entry", () => {
    const result = mealPlanCreateSchema.safeParse({
      recipe_id: "550e8400-e29b-41d4-a716-446655440000",
      planned_date: "2026-02-24",
      meal_type: "dinner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid meal_type", () => {
    const result = mealPlanCreateSchema.safeParse({
      recipe_id: "550e8400-e29b-41d4-a716-446655440000",
      planned_date: "2026-02-24",
      meal_type: "brunch",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = mealPlanCreateSchema.safeParse({
      recipe_id: "550e8400-e29b-41d4-a716-446655440000",
      planned_date: "Feb 24 2026",
      meal_type: "dinner",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = mealPlanCreateSchema.safeParse({
      recipe_id: "not-a-uuid",
      planned_date: "2026-02-24",
      meal_type: "dinner",
    });
    expect(result.success).toBe(false);
  });
});

describe("extractUrlSchema", () => {
  it("accepts a valid URL", () => {
    const result = extractUrlSchema.safeParse({
      url: "https://www.allrecipes.com/recipe/123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = extractUrlSchema.safeParse({
      url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing url", () => {
    const result = extractUrlSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
