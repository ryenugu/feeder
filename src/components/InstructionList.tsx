"use client";

import { useState, useRef } from "react";

export default function InstructionList({
  instructions,
}: {
  instructions: string[];
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const stepRefs = useRef<Map<number, HTMLElement>>(new Map());

  const progress = completedSteps.size;
  const total = instructions.length;
  const allDone = progress === total && total > 0;
  const activeStep = instructions.findIndex((_, i) => !completedSteps.has(i));

  function toggleStep(idx: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        const nextUncompleted = instructions.findIndex(
          (_, i) => i > idx && !next.has(i)
        );
        if (nextUncompleted !== -1) {
          setTimeout(() => {
            stepRefs.current.get(nextUncompleted)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 250);
        }
      }
      return next;
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 px-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
          {progress}/{total}
        </span>
      </div>

      <div className="space-y-2">
        {instructions.map((step, i) => {
          const done = completedSteps.has(i);
          const active = i === activeStep;

          return (
            <button
              key={i}
              ref={(el) => {
                if (el) stepRefs.current.set(i, el);
                else stepRefs.current.delete(i);
              }}
              onClick={() => toggleStep(i)}
              className={`flex w-full items-start gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-300 ${
                active
                  ? "bg-primary/[0.05] ring-1 ring-inset ring-primary/15"
                  : done
                    ? "opacity-40"
                    : ""
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary text-white shadow-sm shadow-primary/25"
                      : "bg-primary-light text-primary"
                }`}
              >
                {done ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <p
                className={`pt-1 text-[15px] leading-relaxed transition-all duration-300 ${
                  done ? "line-through text-muted" : ""
                }`}
              >
                {step}
              </p>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-6 flex flex-col items-center gap-2 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-primary">All steps done!</p>
          <button
            onClick={() => setCompletedSteps(new Set())}
            className="mt-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            Reset progress
          </button>
        </div>
      )}
    </div>
  );
}
