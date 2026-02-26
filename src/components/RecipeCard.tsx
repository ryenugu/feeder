"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/types/recipe";
import defaultImage from "@/images/default.jpg";
import { useToast } from "@/components/Toast";

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

interface RecipeCardProps {
  recipe: Recipe;
  priority?: boolean;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  userMap?: Record<string, string>;
  isFavorited?: boolean;
  onToggleFavorite?: (recipeId: string, favorited: boolean) => void;
}

export default function RecipeCard({ recipe, priority, onDelete, currentUserId, userMap, isFavorited, onToggleFavorite }: RecipeCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const hasImage = recipe.image_url && !imgError;
  const displaySource = recipe.source_name ? formatSourceName(recipe.source_name) : null;
  const [favAnimating, setFavAnimating] = useState(false);

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 300);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipe.id }),
      });
      if (res.ok) {
        const data = await res.json();
        onToggleFavorite?.(recipe.id, data.favorited);
      }
    } catch { /* ignore */ }
  }

  const isShared = currentUserId && userMap && Object.keys(userMap).length > 1;
  const addedByOther = isShared && recipe.user_id !== currentUserId;
  const addedByEmail = addedByOther ? userMap[recipe.user_id] : null;
  const addedByInitial = addedByEmail ? addedByEmail[0].toUpperCase() : null;

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  function handleMenuToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu((v) => !v);
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    router.push(`/recipe/${recipe.id}/edit`);
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);

    const url = `${window.location.origin}/recipe/${recipe.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast({ message: "Link copied to clipboard" });
      } catch { /* clipboard unavailable */ }
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);

    const deletedRecipe = { ...recipe };
    onDelete?.(recipe.id);

    try {
      await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    } catch {
      router.refresh();
      return;
    }

    router.refresh();

    showToast({
      message: "Recipe deleted",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            const res = await fetch("/api/recipes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: deletedRecipe.title,
                image_url: deletedRecipe.image_url,
                source_url: deletedRecipe.source_url,
                source_name: deletedRecipe.source_name,
                total_time: deletedRecipe.total_time,
                prep_time: deletedRecipe.prep_time,
                cook_time: deletedRecipe.cook_time,
                servings: deletedRecipe.servings,
                ingredients: deletedRecipe.ingredients,
                instructions: deletedRecipe.instructions,
                notes: deletedRecipe.notes,
                tags: deletedRecipe.tags,
                categories: deletedRecipe.categories,
                source_images: deletedRecipe.source_images,
              }),
            });
            if (res.ok) router.refresh();
          } catch { /* ignore */ }
        },
      },
    });
  }

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-card border border-border/60 transition-all duration-300 hover:border-border active:scale-[0.98]"
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
        )}
        <button
          onClick={handleFavorite}
          className={`absolute left-2 bottom-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90 ${favAnimating ? "scale-125" : ""}`}
          aria-label={isFavorited ? "Unfavorite" : "Favorite"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "white"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      {addedByInitial && (
        <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md" title={addedByEmail || undefined}>
          {addedByInitial}
        </div>
      )}


      <div ref={menuRef} className="absolute right-2 top-2 z-20">
        <button
          onClick={handleMenuToggle}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/60 active:scale-95"
          aria-label="Recipe options"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-9 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button
              onClick={handleEdit}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-primary-light"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleShare}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-primary-light"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-error transition-colors hover:bg-error-light"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Delete
            </button>
          </div>
        )}
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
