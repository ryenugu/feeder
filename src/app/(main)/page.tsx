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
      <div className="relative mx-4 mb-6 overflow-hidden rounded-3xl">
        <Image
          src={coverImage}
          alt="Feeder — your family recipe collection"
          placeholder="blur"
          priority
          className="h-52 w-full object-cover object-[50%_72%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
        <Link
          href="/add"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95"
          aria-label="Add recipe"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
        <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
          <h1 className="text-[1.7rem] font-bold tracking-tight text-white">
            feeder
          </h1>
          <p className="mt-0.5 text-[13px] font-medium tracking-wide text-white/60">
            Your family recipe collection
          </p>
        </div>
      </div>

      <div className="px-4">
        <RecipeGrid recipes={typedRecipes} />
      </div>
    </div>
  );
}
