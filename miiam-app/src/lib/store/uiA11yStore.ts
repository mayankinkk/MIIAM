"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContrastMode = "normal" | "high";
export type ThemeMode = "light" | "dark" | "system";

interface UiA11yStore {
  contrast: ContrastMode;
  setContrast: (c: ContrastMode) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

export const useUiA11yStore = create<UiA11yStore>()(
  persist(
    (set) => ({
      contrast: "normal",
      setContrast: (c) => set({ contrast: c }),
      theme: "system",
      setTheme: (t) => set({ theme: t }),
      reducedMotion: false,
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    { name: "miiam-ui-a11y" }
  )
);

export function applyUiPrefs(contrast: ContrastMode, theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("high-contrast", contrast === "high");

  const wantsDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", wantsDark);
  root.setAttribute("data-theme", wantsDark ? "dark" : "light");
}
