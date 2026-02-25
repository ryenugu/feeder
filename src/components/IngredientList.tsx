"use client";

import { useState, useMemo } from "react";

function scaleQuantity(text: string, ratio: number): string {
  if (ratio === 1) return text;
  return text.replace(/^([\d\s\/½¼¾⅓⅔⅛]+)/, (match) => {
    const num = parseFraction(match.trim());
    if (isNaN(num)) return match;
    const scaled = num * ratio;
    if (scaled === Math.floor(scaled)) return String(scaled) + " ";
    return scaled.toFixed(1).replace(/\.0$/, "") + " ";
  });
}

function parseFraction(str: string): number {
  const unicodeMap: Record<string, number> = {
    "½": 0.5, "¼": 0.25, "¾": 0.75,
    "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125,
  };

  let total = 0;
  const parts = str.split(/\s+/);
  for (const p of parts) {
    if (unicodeMap[p]) {
      total += unicodeMap[p];
    } else if (p.includes("/")) {
      const [n, d] = p.split("/").map(Number);
      if (d) total += n / d;
    } else {
      const n = parseFloat(p);
      if (!isNaN(n)) total += n;
    }
  }
  return total;
}

interface Props {
  ingredients: string[];
  originalServings: number | null;
  currentServings: number | null;
}

export default function IngredientList({
  ingredients,
  originalServings,
  currentServings,
}: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const ratio =
    originalServings && currentServings
      ? currentServings / originalServings
      : 1;

  const scaledIngredients = useMemo(
    () => ingredients.map((ing) => scaleQuantity(ing, ratio)),
    [ingredients, ratio]
  );

  const checkedCount = checked.size;

  function toggle(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div>
      {checkedCount > 0 && (
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted">
            {checkedCount} of {ingredients.length} ready
          </span>
          <button
            onClick={() => setChecked(new Set())}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Reset
          </button>
        </div>
      )}

      <div className="space-y-0.5">
        {scaledIngredients.map((ing, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-3.5 text-left transition-all duration-200 active:bg-primary-light/50 ${
              checked.has(i) ? "opacity-40" : ""
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                checked.has(i)
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            >
              {checked.has(i) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span
              className={`text-[15px] leading-relaxed transition-all duration-200 ${
                checked.has(i) ? "line-through text-muted" : ""
              }`}
            >
              {ing}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
