"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_PRESETS,
  DEFAULT_PRESET,
  applyThemePreset,
  type ThemePreset,
} from "@/config/themes";

type Mode = "light" | "dark";

type ThemeContextType = {
  theme: Mode;
  toggleTheme: () => void;
  setTheme: (theme: Mode) => void;
  preset: ThemePreset;
  setPreset: (preset: ThemePreset) => void;
  presets: ThemePreset[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Mode>("light");
  const [preset, setPresetState] = useState<ThemePreset>(DEFAULT_PRESET);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedMode = localStorage.getItem("theme") as Mode | null;
    const storedPresetName = localStorage.getItem("theme-preset");

    const resolvedPreset =
      THEME_PRESETS.find((p) => p.name === storedPresetName) || DEFAULT_PRESET;
    setPresetState(resolvedPreset);

    if (storedMode) {
      setThemeState(storedMode);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    applyThemePreset(preset, theme);
  }, [theme, preset, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Mode) => {
    setThemeState(newTheme);
  };

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
    localStorage.setItem("theme-preset", newPreset.name);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        preset,
        setPreset,
        presets: THEME_PRESETS,
      }}
    >
      {mounted ? (
        children
      ) : (
        <div style={{ visibility: "hidden" }}>{children}</div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
