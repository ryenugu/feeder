"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types/recipe";

export default function RecipeCard({ recipe, priority }: { recipe: Recipe; priority?: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group block overflow-hidden rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary-light">
        {recipe.image_url && !imgError ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className="text-primary/30">
              <ellipse cx="32" cy="36" rx="22" ry="10" stroke="currentColor" strokeWidth="2.5" />
              <path d="M10 36c0-11 9.85-20 22-20s22 9 22 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="32" cy="36" rx="14" ry="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide text-primary/40 uppercase">
              {recipe.ingredients.length === 0 && recipe.instructions.length === 0 ? "Link saved" : "No photo"}
            </span>
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
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {recipe.categories?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
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
