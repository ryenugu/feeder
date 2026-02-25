"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Suggestion } from "@/types/recipe";

function SkeletonCard() {
  return (
    <div className="w-[260px] shrink-0 animate-pulse rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 h-3 w-20 rounded-full bg-primary/10" />
      <div className="mb-2 h-4 w-3/4 rounded bg-border/60" />
      <div className="mb-4 h-3 w-full rounded bg-border/40" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-border/40" />
        <div className="h-5 w-16 rounded-full bg-border/40" />
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const recipe = suggestion.recipe_data;
  return (
    <Link
      href={`/discover?highlight=${suggestion.id}`}
      className="group block w-[260px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-border active:scale-[0.98]"
    >
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10">
        <svg
          viewBox="0 0 260 80"
          fill="none"
          className="absolute inset-0 h-full w-full opacity-30"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="220" cy="10" r="40" fill="currentColor" className="text-primary/20" />
          <circle cx="30" cy="70" r="25" fill="currentColor" className="text-accent/20" />
        </svg>
        <div className="absolute bottom-2 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            AI Pick
          </span>
        </div>
      </div>
      <div className="px-3 pb-3.5 pt-2.5">
        <h3 className="line-clamp-1 text-[13px] font-semibold leading-snug tracking-tight">
          {recipe.title}
        </h3>
        {recipe.tags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted">
          {suggestion.reason}
        </p>
        {recipe.total_time && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted/80">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {recipe.total_time}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function SuggestionCarousel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [canGenerate, setCanGenerate] = useState(false);

  useEffect(() => {
    fetch("/api/suggestions")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.suggestions || []);
        setCanGenerate(data.canGenerate || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && suggestions.length === 0 && !canGenerate) return null;
  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Suggested for you</h2>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            AI
          </span>
        </div>
        {suggestions.length > 0 && (
          <Link
            href="/discover"
            className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            See all
          </Link>
        )}
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          suggestions.slice(0, 3).map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))
        )}
      </div>
    </div>
  );
}
