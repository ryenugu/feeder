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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors active:scale-95 active:bg-primary/80"
          aria-label="Decrease servings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="min-w-[2rem] text-center text-base font-bold text-primary">
          {servings}
        </span>
        <button
          onClick={() => onChange(servings + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors active:scale-95 active:bg-primary/80"
          aria-label="Increase servings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
