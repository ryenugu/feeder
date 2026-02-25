"use client";

interface Props {
  servings: number;
  onChange: (val: number) => void;
}

export default function ServingAdjuster({ servings, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Serving Size</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, servings - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/80"
          aria-label="Decrease servings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="min-w-[1.5rem] text-center text-base font-bold text-primary">
          {servings}
        </span>
        <button
          onClick={() => onChange(servings + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/80"
          aria-label="Increase servings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
