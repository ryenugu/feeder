"use client";

import { useState } from "react";

export default function InstructionList({
  instructions,
}: {
  instructions: string[];
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  function toggleStep(idx: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {instructions.map((step, i) => (
        <button
          key={i}
          onClick={() => toggleStep(i)}
          className={`flex w-full items-start gap-4 rounded-lg px-2 py-3 text-left transition-colors active:bg-primary-light/50 ${
            completedSteps.has(i) ? "opacity-50" : ""
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              completedSteps.has(i)
                ? "bg-primary text-white"
                : "bg-primary-light text-primary"
            }`}
          >
            {i + 1}
          </span>
          <p
            className={`pt-0.5 text-sm leading-relaxed ${
              completedSteps.has(i) ? "line-through" : ""
            }`}
          >
            {step}
          </p>
        </button>
      ))}
    </div>
  );
}
