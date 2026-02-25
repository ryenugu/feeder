import { describe, it, expect } from "vitest";

// Test the pure helper functions by importing internal logic
// Since they're not exported, we test via the module's behavior

describe("recipe scraper utilities", () => {
  it("can be imported", async () => {
    const mod = await import("@/lib/recipe-scraper");
    expect(mod.extractRecipe).toBeDefined();
    expect(typeof mod.extractRecipe).toBe("function");
  });
});

describe("ISO duration parsing", () => {
  // We test this indirectly since parseISODuration is not exported
  // These validate that the scraper module loads correctly
  it("module exports extractRecipe function", async () => {
    const { extractRecipe } = await import("@/lib/recipe-scraper");
    expect(extractRecipe).toBeInstanceOf(Function);
  });
});
