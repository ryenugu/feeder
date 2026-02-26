"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { useRouter } from "next/navigation";
import {
  Users,
  ChefHat,
  CalendarDays,
  Store,
  ShoppingCart,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface Metrics {
  total_users: number;
  total_recipes: number;
  total_meal_plans: number;
  total_grocery_stores: number;
  total_grocery_items: number;
  recipes_today: number;
  recipes_this_week: number;
  recipes_this_month: number;
  users_this_week: number;
  users_this_month: number;
  avg_recipes_per_user: number;
  top_users: { email: string; recipe_count: number }[];
  top_categories: { name: string; count: number }[];
  recipes_per_day: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || !isAdmin(session.user.email)) {
        router.replace("/profile");
        return;
      }
      setAuthorized(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authorized) fetchMetrics();
  }, [authorized]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchMetrics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to load metrics");
      setMetrics(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!authorized) return null;

  const maxDayCount = metrics
    ? Math.max(...metrics.recipes_per_day.map((d) => d.count), 1)
    : 1;

  return (
    <div className="px-4 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-card hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-2xl font-bold text-primary">Dashboard</h1>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-card hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error-light p-4 text-sm text-error">
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : metrics ? (
        <div className="space-y-4">
          {/* Primary stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Users size={18} />}
              label="Total Users"
              value={metrics.total_users}
              sub={
                metrics.users_this_month > 0
                  ? `+${metrics.users_this_month} this month`
                  : undefined
              }
              accent
            />
            <StatCard
              icon={<ChefHat size={18} />}
              label="Total Recipes"
              value={metrics.total_recipes}
              sub={
                metrics.recipes_this_month > 0
                  ? `+${metrics.recipes_this_month} this month`
                  : undefined
              }
            />
            <StatCard
              icon={<CalendarDays size={18} />}
              label="Meal Plans"
              value={metrics.total_meal_plans}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Avg per User"
              value={metrics.avg_recipes_per_user}
            />
            <StatCard
              icon={<Store size={18} />}
              label="Grocery Stores"
              value={metrics.total_grocery_stores}
            />
            <StatCard
              icon={<ShoppingCart size={18} />}
              label="Grocery Items"
              value={metrics.total_grocery_items}
            />
          </div>

          {/* Activity this period */}
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Activity</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-background p-3">
                <p className="text-lg font-bold text-primary">
                  {metrics.recipes_today}
                </p>
                <p className="text-[11px] text-muted">Today</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-lg font-bold text-primary">
                  {metrics.recipes_this_week}
                </p>
                <p className="text-[11px] text-muted">This Week</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-lg font-bold text-primary">
                  {metrics.recipes_this_month}
                </p>
                <p className="text-[11px] text-muted">This Month</p>
              </div>
            </div>
          </div>

          {/* 30-day chart */}
          {metrics.recipes_per_day.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">
                Recipes — Last 30 Days
              </h2>
              <div className="flex items-end gap-[3px]" style={{ height: 96 }}>
                {metrics.recipes_per_day.map((d) => {
                  const pct = (d.count / maxDayCount) * 100;
                  return (
                    <div
                      key={d.date}
                      className="group relative flex-1"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary"
                        style={{
                          height: `${Math.max(pct, 4)}%`,
                        }}
                      />
                      <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                        {d.count} — {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span>
                  {metrics.recipes_per_day.length > 0 &&
                    new Date(
                      metrics.recipes_per_day[0].date
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                </span>
                <span>
                  {metrics.recipes_per_day.length > 0 &&
                    new Date(
                      metrics.recipes_per_day[
                        metrics.recipes_per_day.length - 1
                      ].date
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                </span>
              </div>
            </div>
          )}

          {/* Top users */}
          {metrics.top_users.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Top Users</h2>
              <div className="space-y-2">
                {metrics.top_users.map((u, i) => (
                  <div
                    key={u.email}
                    className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {u.email}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {u.recipe_count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top categories */}
          {metrics.top_categories.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Top Categories</h2>
              <div className="flex flex-wrap gap-2">
                {metrics.top_categories.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    {c.name}
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold">
                      {c.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        accent ? "bg-primary text-white" : "bg-card"
      }`}
    >
      <div
        className={`mb-2 flex items-center gap-2 text-xs ${
          accent ? "text-white/70" : "text-muted"
        }`}
      >
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && (
        <p
          className={`mt-1 text-[11px] ${
            accent ? "text-white/60" : "text-muted"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
