export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryLight: string;
  accent: string;
  muted: string;
  card: string;
  border: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  overlay: string;
  cardShadow: string;
  cardShadowHover: string;
  searchShadow: string;
  navShadow: string;
  primaryShadow: string;
}

export interface ThemePreset {
  name: string;
  label: string;
  light: ThemeColors;
  dark: ThemeColors;
}

const warmMauve: ThemePreset = {
  name: "warm-mauve",
  label: "Warm Mauve",
  light: {
    background: "#f9f7f5",
    foreground: "#2a2523",
    primary: "#8b6b7c",
    primaryLight: "#f5eff2",
    accent: "#6b9080",
    muted: "#9a918c",
    card: "#ffffff",
    border: "#e9e4e0",
    error: "#c75050",
    errorLight: "#fef2f2",
    success: "#4a9070",
    successLight: "#f0faf5",
    overlay: "rgba(30, 26, 24, 0.40)",
    cardShadow: "0 1px 3px rgba(42, 37, 35, 0.04), 0 4px 12px rgba(42, 37, 35, 0.03)",
    cardShadowHover: "0 2px 8px rgba(42, 37, 35, 0.06), 0 8px 24px rgba(42, 37, 35, 0.06)",
    searchShadow: "0 1px 2px rgba(42, 37, 35, 0.04)",
    navShadow: "0 -1px 12px rgba(42, 37, 35, 0.04)",
    primaryShadow: "0 2px 8px rgba(139, 107, 124, 0.25)",
  },
  dark: {
    background: "#141112",
    foreground: "#e6e2df",
    primary: "#b894a5",
    primaryLight: "#231c1f",
    accent: "#8bbaa3",
    muted: "#7d7570",
    card: "#1c1819",
    border: "#302a2c",
    error: "#e87777",
    errorLight: "#2a1919",
    success: "#7ac4a0",
    successLight: "#162b20",
    overlay: "rgba(0, 0, 0, 0.50)",
    cardShadow: "0 1px 3px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.10)",
    cardShadowHover: "0 2px 8px rgba(0, 0, 0, 0.18), 0 8px 24px rgba(0, 0, 0, 0.14)",
    searchShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
    navShadow: "0 -1px 12px rgba(0, 0, 0, 0.25)",
    primaryShadow: "0 2px 8px rgba(184, 148, 165, 0.25)",
  },
};

const feederGreen: ThemePreset = {
  name: "feeder-green",
  label: "Feeder Green",
  light: {
    background: "#faf8f5",
    foreground: "#1c1917",
    primary: "#2d8b5e",
    primaryLight: "#eef6f1",
    accent: "#e8734a",
    muted: "#a1998f",
    card: "#ffffff",
    border: "#ebe7e0",
    error: "#c75050",
    errorLight: "#fef2f2",
    success: "#2d8b5e",
    successLight: "#eef6f1",
    overlay: "rgba(28, 25, 23, 0.40)",
    cardShadow: "0 1px 3px rgba(28, 25, 23, 0.04), 0 4px 12px rgba(28, 25, 23, 0.03)",
    cardShadowHover: "0 2px 8px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.06)",
    searchShadow: "0 1px 2px rgba(28, 25, 23, 0.04)",
    navShadow: "0 -1px 12px rgba(28, 25, 23, 0.04)",
    primaryShadow: "0 2px 8px rgba(45, 139, 94, 0.25)",
  },
  dark: {
    background: "#111318",
    foreground: "#e8e6e3",
    primary: "#3fb884",
    primaryLight: "#182a22",
    accent: "#ff8a65",
    muted: "#7d7a75",
    card: "#1a1d24",
    border: "#2a2d35",
    error: "#e87777",
    errorLight: "#2a1919",
    success: "#3fb884",
    successLight: "#182a22",
    overlay: "rgba(0, 0, 0, 0.50)",
    cardShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)",
    cardShadowHover: "0 2px 8px rgba(0, 0, 0, 0.16), 0 8px 24px rgba(0, 0, 0, 0.12)",
    searchShadow: "0 1px 2px rgba(0, 0, 0, 0.10)",
    navShadow: "0 -1px 12px rgba(0, 0, 0, 0.20)",
    primaryShadow: "0 2px 8px rgba(63, 184, 132, 0.25)",
  },
};

const oceanBreeze: ThemePreset = {
  name: "ocean-breeze",
  label: "Ocean Breeze",
  light: {
    background: "#f5f8fa",
    foreground: "#1e2a32",
    primary: "#4a7c8a",
    primaryLight: "#eaf3f6",
    accent: "#b08968",
    muted: "#8a9499",
    card: "#ffffff",
    border: "#dfe6ea",
    error: "#c75050",
    errorLight: "#fef2f2",
    success: "#4a9070",
    successLight: "#f0faf5",
    overlay: "rgba(30, 42, 50, 0.40)",
    cardShadow: "0 1px 3px rgba(30, 42, 50, 0.04), 0 4px 12px rgba(30, 42, 50, 0.03)",
    cardShadowHover: "0 2px 8px rgba(30, 42, 50, 0.06), 0 8px 24px rgba(30, 42, 50, 0.06)",
    searchShadow: "0 1px 2px rgba(30, 42, 50, 0.04)",
    navShadow: "0 -1px 12px rgba(30, 42, 50, 0.04)",
    primaryShadow: "0 2px 8px rgba(74, 124, 138, 0.25)",
  },
  dark: {
    background: "#0f1416",
    foreground: "#dde3e7",
    primary: "#6fb0c2",
    primaryLight: "#162025",
    accent: "#d4a574",
    muted: "#6e787e",
    card: "#171e22",
    border: "#263035",
    error: "#e87777",
    errorLight: "#2a1919",
    success: "#7ac4a0",
    successLight: "#162b20",
    overlay: "rgba(0, 0, 0, 0.50)",
    cardShadow: "0 1px 3px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.10)",
    cardShadowHover: "0 2px 8px rgba(0, 0, 0, 0.18), 0 8px 24px rgba(0, 0, 0, 0.14)",
    searchShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
    navShadow: "0 -1px 12px rgba(0, 0, 0, 0.25)",
    primaryShadow: "0 2px 8px rgba(111, 176, 194, 0.25)",
  },
};

export const THEME_PRESETS: ThemePreset[] = [warmMauve, feederGreen, oceanBreeze];
export const DEFAULT_PRESET = warmMauve;

export function applyThemePreset(preset: ThemePreset, mode: "light" | "dark") {
  const colors = mode === "dark" ? preset.dark : preset.light;
  const root = document.documentElement;

  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-light", colors.primaryLight);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--error", colors.error);
  root.style.setProperty("--error-light", colors.errorLight);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--success-light", colors.successLight);
  root.style.setProperty("--overlay", colors.overlay);
  root.style.setProperty("--card-shadow", colors.cardShadow);
  root.style.setProperty("--card-shadow-hover", colors.cardShadowHover);
  root.style.setProperty("--search-shadow", colors.searchShadow);
  root.style.setProperty("--nav-shadow", colors.navShadow);
  root.style.setProperty("--primary-shadow", colors.primaryShadow);
}
