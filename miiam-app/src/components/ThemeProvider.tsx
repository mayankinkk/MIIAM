"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useThemeStore } from "@/lib/store/themeStore";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const hasHydrated = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }
    const store = useThemeStore.getState();
    const resolved = store.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : store.theme;
    applyThemeClass(resolved);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (useThemeStore.getState().theme === "system") {
        applyThemeClass(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return <>{children}</>;
}
