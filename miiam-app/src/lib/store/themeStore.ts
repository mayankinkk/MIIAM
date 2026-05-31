"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const applyTheme = (resolved: "light" | "dark") => {
  document.documentElement.classList.toggle("dark", resolved === "dark");
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      resolvedTheme: "light",
      setTheme: (theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });
      },
      toggleTheme: () => {
        const current = get().resolvedTheme;
        const newTheme = current === "dark" ? "light" : "dark";
        set({ theme: newTheme, resolvedTheme: newTheme });
      },
    }),
    { name: "miiam-theme" }
  )
);
