import { createContext, useContext, useEffect } from "react";
import { useStore } from "../lib/store";
import type { ThemeMode, ThemeColor } from "../types";

interface ThemeContextValue {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useStore((state) => state.themeMode);
  const themeColor = useStore((state) => state.themeColor);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const setThemeColor = useStore((state) => state.setThemeColor);

  // Apply theme to document root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.setAttribute("data-theme", themeColor);

    if (themeMode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(themeMode);
    }
  }, [themeMode, themeColor]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  const value: ThemeContextValue = {
    themeMode,
    themeColor,
    setThemeMode,
    setThemeColor,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
