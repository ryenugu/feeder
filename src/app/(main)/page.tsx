import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Recipe } from "@/types/recipe";
import RecipeGrid from "@/components/RecipeGrid";

import coverImage from "@/images/c4355a99-7f7a-4525-a862-bd7861c8b8c2.jpg";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  const typedRecipes = (recipes || []) as Recipe[];

  return (
    <div>
      <div className="mx-4 mb-6">
        <div className="relative">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Your family recipe collection
          </p>
          <h1
            className="relative z-10 -mb-5 px-1 font-black leading-[0.9] tracking-tighter text-foreground"
            style={{ fontSize: "clamp(2.8rem, 12vw, 3.5rem)" }}
          >
            feeder
          </h1>
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={coverImage}
              alt="Feeder — your family recipe collection"
              placeholder="blur"
              priority
              className="h-36 w-full object-cover object-[50%_65%]"
            />
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/20 to-transparent" />
          </div>
          <Link
            href="/add"
            className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white primary-shadow transition-all hover:brightness-110 active:scale-95"
            aria-label="Add recipe"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="px-4">
        <RecipeGrid recipes={typedRecipes} />
      </div>
    </div>
  );
}
