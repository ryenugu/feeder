import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types/recipe";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group block overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary-light">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary/40"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M15 8h.01M9 8h.01M8 14s1.5 2 4 2 4-2 4-2" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {recipe.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
          {recipe.total_time && <span>{recipe.total_time}</span>}
          {recipe.source_name && (
            <span className="truncate">{recipe.source_name}</span>
          )}
        </div>
        {recipe.categories?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
