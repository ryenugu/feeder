"use client";

interface Props {
  servings: number;
  onChange: (val: number) => void;
}

export default function ServingAdjuster({ servings, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-1.5 py-1">
      <button
        onClick={() => onChange(Math.max(1, servings - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-all active:scale-90"
        aria-label="Decrease servings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span className="min-w-[1.75rem] text-center text-sm font-bold text-primary tabular-nums">
        {servings}
      </span>
      <button
        onClick={() => onChange(servings + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-all active:scale-90"
        aria-label="Increase servings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
