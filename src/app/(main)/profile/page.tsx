"use client";

import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/Toast";
import FamilySection from "@/components/FamilySection";

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
  const [showSettings, setShowSettings] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
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

      <div className="mb-4 rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-xs text-muted">Signed in as</p>
        <p className="text-sm font-medium">{email || "Loading..."}</p>
      </div>

      <FamilySection currentUserEmail={email} />

      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-sm font-semibold">Settings</h2>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted transition-transform ${showSettings ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showSettings && (
          <div className="mt-4 space-y-4">
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

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V7H6v11zM3.5 7C2.67 7 2 7.67 2 8.5v7c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-7C5 7.67 4.33 7 3.5 7zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zM15.53 2.16l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 6h12c0-1.52-.56-2.91-1.47-3.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" fill="currentColor"/>
                  </svg>
                  <p className="text-xs font-semibold text-primary">Android</p>
                  <p className="text-xs text-muted">Share via installed app</p>
                </div>
                <button
                  onClick={() => setShowAndroid(!showAndroid)}
                  className="text-xs font-medium text-primary"
                >
                  {showAndroid ? "Hide" : "Setup"}
                </button>
              </div>

              {showAndroid && (
                <div className="mb-3 rounded-xl bg-primary-light/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-primary">
                    Setup Instructions
                  </p>
                  <ol className="space-y-1 text-[11px] leading-relaxed text-foreground/70">
                    <li>1. Open Feeder in Chrome on your Android phone</li>
                    <li>2. Tap the browser menu (&vellip;) &rarr; &quot;Install app&quot; or &quot;Add to Home screen&quot;</li>
                    <li>3. Share any recipe link from any app</li>
                    <li>4. Select <span className="font-semibold text-foreground">Feeder</span> from the share menu — done!</li>
                  </ol>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z" fill="currentColor"/>
                    <path d="M15.07 2c.24 1-.36 2.03-1.08 2.75C13.21 5.49 12.05 6 11.02 5.93c-.29-.98.42-2 1.08-2.64.76-.74 2.03-1.3 2.97-1.29z" fill="currentColor"/>
                  </svg>
                  <p className="text-xs font-semibold text-primary">iOS</p>
                  <p className="text-xs text-muted">Share via Shortcut</p>
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
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4 rounded-2xl bg-card p-5 shadow-sm">
        {isAdmin(email) && (
          <>
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
      </div>

      <button
        onClick={handleSignOut}
        className="mt-4 w-full rounded-2xl border border-error/20 bg-error-light py-3 text-sm font-medium text-error transition-colors hover:bg-error/10"
      >
        Sign Out
      </button>
    </div>
  );
}
