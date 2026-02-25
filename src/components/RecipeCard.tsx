"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types/recipe";
import defaultImage from "@/images/default.jpg";

function formatSourceName(name: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(name)) return "";

  let host = name;
  host = host.replace(/^https?:\/\//, "");
  host = host.replace(/^[^@]+@/, "");
  host = host.replace(/[/?#].*$/, "");
  host = host.replace(/:\d+$/, "");
  host = host.replace(/^www\./, "");

  return host;
}

export default function RecipeCard({ recipe, priority }: { recipe: Recipe; priority?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = recipe.image_url && !imgError;
  const displaySource = recipe.source_name ? formatSourceName(recipe.source_name) : null;

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group block overflow-hidden rounded-2xl bg-card card-shadow transition-all duration-300 hover:card-shadow-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {hasImage ? (
          <Image
            src={recipe.image_url!}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            onError={() => setImgError(true)}
            unoptimized={recipe.image_url!.toLowerCase().endsWith(".jfif")}
          />
        ) : (
          <>
            <Image
              src={defaultImage}
              alt={recipe.title}
              fill
              placeholder="blur"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 512px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="px-3 pb-3.5 pt-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight">
          {recipe.title}
        </h3>
        {(recipe.total_time || displaySource) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
            {recipe.total_time && (
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {recipe.total_time}
              </span>
            )}
            {recipe.total_time && displaySource && (
              <span className="text-border">·</span>
            )}
            {displaySource && (
              <span className="truncate">{displaySource}</span>
            )}
          </div>
        )}
        {recipe.categories?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
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
