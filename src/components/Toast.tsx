"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface ToastItem {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}>
        {toasts.map((toast) => (
          <ToastBubble key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={`flex max-w-[90vw] items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 font-bold text-primary"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
