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

  function toggle(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="space-y-1">
      {scaledIngredients.map((ing, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className={`flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-primary-light/50 ${
            checked.has(i) ? "opacity-50" : ""
          }`}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
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
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span
            className={`text-sm leading-relaxed ${
              checked.has(i) ? "line-through" : ""
            }`}
          >
            {ing}
          </span>
        </button>
      ))}
    </div>
  );
}
