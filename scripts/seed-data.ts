export type SeedType = "url" | "link-only" | "document";

export interface SeedRecipe {
  url: string;
  name: string;
  type: SeedType;
  /** Only for type "document" — paths relative to scripts/ */
  imagePaths?: string[];
}

export const SEED_RECIPES: SeedRecipe[] = [
  {
    url: "https://dinnerthendessert.com/chipotle-black-beans-copycat/",
    name: "Chipotle Black Beans (Copycat)",
    type: "url",
  },
  {
    url: "https://nestingwithgrace.com/one-pan-chicken-dinner-a-family-favorite-dinner/",
    name: "One Pan Chicken Dinner",
    type: "url",
  },
  {
    url: "https://keytomylime.com/cream-cheese-chicken-chili-recipe/",
    name: "Cream Cheese Chicken Chili",
    type: "url",
  },
  {
    url: "https://www.halfbakedharvest.com/easy-healthier-crockpot-butter-chicken/",
    name: "Crockpot Butter Chicken",
    type: "url",
  },
  {
    url: "https://easyhealthllc.com/chicken/low-carb-chicken-philly-cheesesteak-bowl/",
    name: "Low Carb Chicken Philly Cheesesteak Bowl",
    type: "url",
  },
  {
    url: "https://www.indianhealthyrecipes.com/potato-masala-aloo-masala/",
    name: "Aloo Masala (Potato Masala)",
    type: "url",
  },
  {
    url: "https://www.indianhealthyrecipes.com/peanut-chutney-groundnut-chutney-recipe/",
    name: "Peanut Chutney (Groundnut Chutney)",
    type: "url",
  },
  {
    url: "https://tastesbetterfromscratch.com/sheet-pan-chicken-fajitas/",
    name: "Sheet Pan Chicken Fajitas",
    type: "url",
  },
  {
    url: "https://www.instagram.com/reel/DUBHa9okXnH/?igsh=MW92N3pnZnYxcXF2Yw==",
    name: "Instagram Reel Recipe",
    type: "link-only",
  },
  {
    url: "uploaded-document",
    name: "Spinach Daal",
    type: "document",
    imagePaths: [
      "fixtures/spinach-daal-page1.png",
      "fixtures/spinach-daal-page2.png",
    ],
  },
];
