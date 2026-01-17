import { createContext } from "react";
import type { ThemeMode, ThemeColor } from "../types";

export interface ThemeContextValue {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
