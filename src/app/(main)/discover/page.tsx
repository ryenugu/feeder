"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Suggestion } from "@/types/recipe";
import { useToast } from "@/components/Toast";
import { Heart } from "lucide-react";

const PROGRESS_STEPS = [
  "Analyzing your recipes...",
  "Building your taste profile...",
  "Asking AI for ideas...",
  "Crafting personalized suggestions...",
  "Almost done...",
];

function GeneratingOverlay({ step }: { step: number }) {
  const progress = Math.min(((step + 1) / PROGRESS_STEPS.length) * 100, 95);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
          <svg className="h-7 w-7 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <h2 className="mb-2 text-lg font-semibold">Cooking up ideas</h2>
      <p className="mb-6 max-w-[280px] text-[13px] leading-relaxed text-muted">
        {PROGRESS_STEPS[step]}
      </p>
      <div className="w-56">
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
      {tag}
    </span>
  );
}

function SuggestionDetailSheet({
  suggestion,
  onClose,
  onSave,
  onDismiss,
  saving,
}: {
  suggestion: Suggestion;
  onClose: () => void;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
}) {
  const recipe = suggestion.recipe_data;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: "var(--overlay)" }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-[slideUp_0.3s_ease-out] overflow-y-auto overscroll-contain rounded-t-3xl bg-background pb-10 safe-bottom safe-x" style={{ maxHeight: "90dvh" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm px-5 pb-3 pt-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              AI Suggestion
            </span>
          </div>
          <h2 className="text-xl font-bold leading-tight">{recipe.title}</h2>

          {recipe.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          <p className="mt-2 text-sm leading-relaxed text-muted">
            {recipe.description}
          </p>
          <p className="mt-2 text-xs italic text-primary/80">{suggestion.reason}</p>

          {(recipe.total_time || recipe.prep_time || recipe.cook_time || recipe.servings) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {recipe.total_time && (
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-xs font-semibold">{recipe.total_time}</span>
                </div>
              )}
              {recipe.prep_time && (
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                  <span className="text-[10px] font-medium uppercase text-muted">Prep</span>
                  <span className="text-xs font-semibold">{recipe.prep_time}</span>
                </div>
              )}
              {recipe.cook_time && (
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                  <span className="text-[10px] font-medium uppercase text-muted">Cook</span>
                  <span className="text-xs font-semibold">{recipe.cook_time}</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                  <span className="text-[10px] font-medium uppercase text-muted">Serves</span>
                  <span className="text-xs font-semibold">{recipe.servings}</span>
                </div>
              )}
            </div>
          )}

          {recipe.ingredients.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
                Ingredients
              </h3>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    {ing}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 inline-block rounded-md bg-primary-light px-3 py-1 text-sm font-bold text-primary">
                Instructions
              </h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-primary-light hover:text-foreground active:scale-[0.98]"
            >
              Not for me
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
              Save to My Recipes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionGridCard({
  suggestion,
  onClick,
  onSave,
  onDismiss,
  saving,
}: {
  suggestion: Suggestion;
  onClick: () => void;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
}) {
  const recipe = suggestion.recipe_data;
  const ingredientPreview = recipe.ingredients.slice(0, 3).join(", ");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-border">
      <button
        onClick={onClick}
        className="block w-full text-left active:scale-[0.99] transition-transform"
      >
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10">
          <svg
            viewBox="0 0 400 96"
            fill="none"
            className="absolute inset-0 h-full w-full opacity-25"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="350" cy="15" r="50" fill="currentColor" className="text-primary/20" />
            <circle cx="50" cy="80" r="35" fill="currentColor" className="text-accent/20" />
            <circle cx="200" cy="90" r="60" fill="currentColor" className="text-primary/10" />
          </svg>
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              AI Pick
            </span>
            {recipe.tags?.[0] && (
              <span className="rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur-sm">
                {recipe.tags[0]}
              </span>
            )}
          </div>
        </div>
        <div className="px-3.5 pb-2 pt-2.5">
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight">
            {recipe.title}
          </h3>
          {recipe.tags && recipe.tags.length > 1 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {recipe.tags.slice(1).map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
            {suggestion.reason}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted/80">
            {recipe.total_time && (
              <span className="flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {recipe.total_time}
              </span>
            )}
            {recipe.total_time && recipe.servings && <span className="text-border">·</span>}
            {recipe.servings && <span>Serves {recipe.servings}</span>}
          </div>
          {ingredientPreview && (
            <p className="mt-1.5 line-clamp-1 text-[10px] text-muted/60">
              {ingredientPreview}...
            </p>
          )}
        </div>
      </button>
      <div className="flex border-t border-border/40">
        <button
          onClick={onDismiss}
          className="flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-primary-light hover:text-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Skip
        </button>
        <div className="w-px bg-border/40" />
        <button
          onClick={onSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {saving ? (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          Save
        </button>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [canGenerate, setCanGenerate] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const generatingRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setCanGenerate(data.canGenerate || false);
      setRecipeCount(data.recipeCount || 0);
      setUserIsAdmin(data.isAdmin || false);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight) setSelectedId(highlight);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  async function handleGenerate() {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setProgressStep(0);

    progressTimerRef.current = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);

    try {
      const res = await fetch("/api/suggestions/generate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        showToast({ message: err.error || "Failed to generate suggestions" });
        return;
      }
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      showToast({ message: "Fresh recipe ideas ready!" });
    } catch {
      showToast({ message: "Something went wrong. Try again." });
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setGenerating(false);
      generatingRef.current = false;
    }
  }

  async function handleSave(id: string) {
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "saved" }),
      });
      if (!res.ok) {
        showToast({ message: "Failed to save recipe" });
        return;
      }
      const data = await res.json();
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setSelectedId(null);
      showToast({
        message: "Recipe saved!",
        action: {
          label: "View",
          onClick: () => router.push(`/recipe/${data.recipe.id}`),
        },
      });
    } catch {
      showToast({ message: "Something went wrong" });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDismiss(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    setSelectedId(null);
    try {
      await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
    } catch {
      /* ignore */
    }
  }

  const selectedSuggestion = suggestions.find((s) => s.id === selectedId);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">Discover</h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              AI
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            Personalized recipe ideas based on your collection
          </p>
        </div>
      </div>

      {generating ? (
        <GeneratingOverlay step={progressStep} />
      ) : !canGenerate ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
            <Heart size={28} strokeWidth={1.5} className="text-primary" />
          </div>
          {!userIsAdmin ? (
            <>
              <h2 className="mb-2 text-lg font-semibold">No suggestions yet</h2>
              <p className="mb-3 max-w-[280px] text-[13px] leading-relaxed text-muted">
                Only admins can generate AI suggestions. Check back later for new ideas!
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold">Save a few more recipes</h2>
              <p className="mb-3 max-w-[280px] text-[13px] leading-relaxed text-muted">
                We need at least 3 recipes to understand your taste.
                You have {recipeCount} so far — add {3 - recipeCount} more to unlock AI suggestions.
              </p>
            </>
          )}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
            <Heart size={28} strokeWidth={1.5} className="text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Ready to discover?</h2>
          <p className="mb-5 max-w-[280px] text-[13px] leading-relaxed text-muted">
            We&apos;ll analyze your {recipeCount} saved recipes and suggest new ones you&apos;ll love.
          </p>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Generate Ideas
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted/70">
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
            </p>
            {userIsAdmin && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-full bg-primary-light px-3.5 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15 active:scale-[0.98]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                New ideas
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {suggestions.map((s) => (
              <SuggestionGridCard
                key={s.id}
                suggestion={s}
                onClick={() => setSelectedId(s.id)}
                onSave={() => handleSave(s.id)}
                onDismiss={() => handleDismiss(s.id)}
                saving={savingIds.has(s.id)}
              />
            ))}
          </div>
        </>
      )}

      {selectedSuggestion && (
        <SuggestionDetailSheet
          suggestion={selectedSuggestion}
          onClose={() => setSelectedId(null)}
          onSave={() => handleSave(selectedSuggestion.id)}
          onDismiss={() => handleDismiss(selectedSuggestion.id)}
          saving={savingIds.has(selectedSuggestion.id)}
        />
      )}
    </div>
  );
}
