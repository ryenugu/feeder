"use client";

import { useEffect, type ReactNode } from "react";
import { ToastProvider } from "./Toast";
import ErrorBoundary from "./ErrorBoundary";

export default function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed, non-critical
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
