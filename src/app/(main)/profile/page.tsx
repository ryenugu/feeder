"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/Toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  active: boolean;
}

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email || null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadApiKeys() {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) setApiKeys(await res.json());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function handleCreateKey() {
    setCreatingKey(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "iOS Shortcut" }),
      });
      if (res.ok) {
        const key = await res.json();
        setApiKeys((prev) => [key, ...prev]);
        await navigator.clipboard.writeText(key.key);
        showToast({ message: "API key created and copied to clipboard" });
      }
    } catch {
      showToast({ message: "Failed to create API key" });
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleDeleteKey(id: string) {
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
        showToast({ message: "API key deleted" });
      }
    } catch {
      /* ignore */
    }
  }

  async function handleCopyKey(key: string) {
    await navigator.clipboard.writeText(key);
    showToast({ message: "Copied to clipboard" });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-4 pb-24">
      <h1 className="mb-6 text-2xl font-bold text-primary">Profile</h1>

      <div className="space-y-4 rounded-2xl bg-card p-5 shadow-sm">
        <div>
          <p className="text-xs text-muted">Signed in as</p>
          <p className="text-sm font-medium">{email || "Loading..."}</p>
        </div>

        <hr className="border-border" />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Appearance</h3>
            <p className="text-xs text-muted">
              {theme === "light" ? "Light" : "Dark"} mode
            </p>
          </div>
          <ThemeToggle />
        </div>

        <hr className="border-border" />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">iOS Share Shortcut</h3>
              <p className="mt-0.5 text-xs text-muted">
                Use API keys to save recipes from your iPhone
              </p>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs font-medium text-primary"
            >
              {showKeys ? "Hide" : "Manage"}
            </button>
          </div>

          {showKeys && (
            <div className="space-y-3">
              <button
                onClick={handleCreateKey}
                disabled={creatingKey}
                className="w-full rounded-xl border-2 border-dashed border-primary/30 py-2.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-light disabled:opacity-50"
              >
                {creatingKey ? "Creating..." : "+ Generate New API Key"}
              </button>

              {apiKeys.length > 0 && (
                <div className="space-y-2">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center gap-2 rounded-xl bg-background p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{key.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted">
                          {key.key.slice(0, 12)}...{key.key.slice(-6)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyKey(key.key)}
                        className="shrink-0 rounded-lg bg-primary-light p-2 text-primary transition-colors hover:bg-primary hover:text-white"
                        aria-label="Copy key"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Delete key"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-primary-light/50 p-3">
                <p className="mb-1 text-xs font-semibold text-primary">
                  Setup Instructions
                </p>
                <ol className="space-y-1 text-[11px] leading-relaxed text-foreground/70">
                  <li>1. Generate an API key above</li>
                  <li>2. Open the Shortcuts app on your iPhone</li>
                  <li>3. Create a new shortcut with &quot;Get URLs from Input&quot;</li>
                  <li>
                    4. Add &quot;Get Contents of URL&quot; action:
                    <br />
                    &nbsp;&nbsp;URL: <span className="font-mono text-primary">{typeof window !== "undefined" ? window.location.origin : ""}/api/recipes/quick-save</span>
                    <br />
                    &nbsp;&nbsp;Method: POST
                    <br />
                    &nbsp;&nbsp;Header: <span className="font-mono">x-api-key: YOUR_KEY</span>
                    <br />
                    &nbsp;&nbsp;Body (JSON): <span className="font-mono">{`{"url": "URL from step 3"}`}</span>
                  </li>
                  <li>5. Add shortcut to Share Sheet</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <hr className="border-border" />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Contact Us</h3>
            <p className="text-xs text-muted">Questions or feedback? Reach out</p>
          </div>
          <a
            href="mailto:ryenugu@gmail.com"
            className="flex items-center gap-1.5 rounded-xl bg-primary-light px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
            Email
          </a>
        </div>

        <hr className="border-border" />

        <button
          onClick={handleSignOut}
          className="w-full rounded-xl border border-red-200 bg-red-500/10 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:border-red-900/30 dark:text-red-400"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
