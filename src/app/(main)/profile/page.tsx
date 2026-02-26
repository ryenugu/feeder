"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
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
  const { theme, preset, setPreset, presets } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email || null);
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
      if (!res.ok) {
        showToast({ message: "Failed to create API key" });
        return;
      }
      const key = await res.json();
      setApiKeys((prev) => [key, ...prev]);
      try {
        await navigator.clipboard.writeText(key.key);
        showToast({ message: "API key created and copied to clipboard" });
      } catch {
        showToast({ message: "API key created — tap the copy button to copy it" });
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

        {isAdmin(email) && (
          <>
            <hr className="border-border" />
            <button
              onClick={() => router.push("/profile/admin")}
              className="flex w-full items-center justify-between rounded-xl bg-primary-light px-4 py-3 transition-colors hover:bg-primary/15 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">Admin Dashboard</p>
                  <p className="text-[11px] text-muted">Users, metrics &amp; analytics</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

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

        <div>
          <h3 className="mb-2 text-sm font-semibold">Theme</h3>
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => setPreset(p)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                  preset.name === p.name
                    ? "ring-2 ring-primary bg-primary-light text-primary"
                    : "border border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      theme === "dark" ? p.dark.primary : p.light.primary,
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        <div>
          <h3 className="mb-3 text-sm font-semibold">Quick Save from Share Sheet</h3>

          <div className="mb-3 rounded-xl bg-primary-light/50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
                <path d="M20.52 3.449C18.24 1.245 15.24 0 12.05 0 5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.424-8.452z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="text-xs font-semibold text-primary">Android</p>
            </div>
            <ol className="space-y-1 text-[11px] leading-relaxed text-foreground/70">
              <li>1. Install Feeder as an app (tap the browser menu &rarr; &quot;Install app&quot; or &quot;Add to Home screen&quot;)</li>
              <li>2. Share any recipe link from any app</li>
              <li>3. Select <span className="font-semibold text-foreground">Feeder</span> from the share menu — done!</li>
            </ol>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z" fill="currentColor"/>
                <path d="M15.07 2c.24 1-.36 2.03-1.08 2.75C13.21 5.49 12.05 6 11.02 5.93c-.29-.98.42-2 1.08-2.64.76-.74 2.03-1.3 2.97-1.29z" fill="currentColor"/>
              </svg>
              <p className="text-xs font-semibold text-primary">iOS Shortcut</p>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs font-medium text-primary"
            >
              {showKeys ? "Hide" : "Setup"}
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
                        className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-error-light hover:text-error"
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
          className="w-full rounded-xl border border-error/20 bg-error-light py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
