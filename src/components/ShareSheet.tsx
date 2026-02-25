"use client";

import { useState, useEffect, useCallback } from "react";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  text: string;
  showToast: (opts: { message: string }) => void;
}

export default function ShareSheet({
  open,
  onClose,
  title,
  url,
  text,
  showToast,
}: ShareSheetProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const supportsShare = typeof navigator !== "undefined" && !!navigator.share;

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      setCopied(null);
    } else {
      setVisible(false);
    }
  }, [open]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("link");
      showToast({ message: "Link copied to clipboard" });
      setTimeout(close, 600);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("text");
      showToast({ message: "Recipe copied to clipboard" });
      setTimeout(close, 600);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* user cancelled */
    }
    close();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 backdrop-blur-[2px] transition-opacity duration-250 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={close}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-card px-5 pb-8 pt-4 shadow-2xl transition-transform duration-250 ease-out safe-x ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        <h3 className="mb-1 text-lg font-bold">Share Recipe</h3>
        <p className="mb-5 truncate text-sm text-muted">{title}</p>

        <div className="flex flex-col gap-2">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-primary-light active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Copy Link</p>
              <p className="truncate text-xs text-muted">{url}</p>
            </div>
            {copied === "link" && (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="shrink-0 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Copy as Text */}
          <button
            onClick={copyText}
            className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-primary-light active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Copy as Text</p>
              <p className="text-xs text-muted">
                Ingredients, instructions & more
              </p>
            </div>
            {copied === "text" && (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="shrink-0 text-primary"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Native Share */}
          {supportsShare && (
            <button
              onClick={nativeShare}
              className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-primary-light active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">More Options</p>
                <p className="text-xs text-muted">
                  Messages, email, social media & more
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-muted"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Cancel */}
        <button
          onClick={close}
          className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:bg-primary-light active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </>
  );
}
