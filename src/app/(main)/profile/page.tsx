"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email || null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-4">
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
          <h3 className="mb-2 text-sm font-semibold">iOS Share Shortcut</h3>
          <p className="text-xs leading-relaxed text-muted">
            To add recipes from any app on your iPhone, create an Apple Shortcut
            that sends the URL to this app. See the setup guide in the README for
            instructions.
          </p>
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
