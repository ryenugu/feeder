"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "saving" | "success" | "error" | "no-url";

export default function ShareTargetPage() {
  return (
    <Suspense>
      <ShareTargetContent />
    </Suspense>
  );
}

function ShareTargetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("saving");
  const [message, setMessage] = useState("");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const rawUrl = searchParams.get("url");
    const rawText = searchParams.get("text");
    const sharedTitle = searchParams.get("title");

    const url = extractUrl(rawUrl, rawText, sharedTitle);

    if (!url) {
      setStatus("no-url");
      setMessage("No recipe URL found in the shared content.");
      return;
    }

    saveRecipe(url);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function extractUrl(...values: (string | null)[]): string | null {
    for (const val of values) {
      if (!val) continue;
      const match = val.match(/https?:\/\/[^\s]+/);
      if (match) return match[0];
    }
    return null;
  }

  async function saveRecipe(url: string) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent(`/share?url=${encodeURIComponent(url)}`)}`);
      return;
    }

    try {
      const res = await fetch("/api/recipes/quick-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Save failed (${res.status})`);
      }

      const recipe = await res.json();
      setRecipeId(recipe.id);
      setStatus("success");
      setMessage(recipe.title || "Recipe saved");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to save recipe");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-card p-6 text-center shadow-sm">
        {status === "saving" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
              <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Saving Recipe</h2>
              <p className="mt-1 text-sm text-muted">Extracting recipe details...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Saved</h2>
              <p className="mt-1 text-sm text-muted">{message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.replace("/")}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium transition-colors hover:bg-primary-light"
              >
                Home
              </button>
              {recipeId && (
                <button
                  onClick={() => router.replace(`/recipe/${recipeId}`)}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  View Recipe
                </button>
              )}
            </div>
          </>
        )}

        {(status === "error" || status === "no-url") && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-light">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-error">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {status === "no-url" ? "No URL Found" : "Something Went Wrong"}
              </h2>
              <p className="mt-1 text-sm text-muted">{message}</p>
            </div>
            <button
              onClick={() => router.replace("/")}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
