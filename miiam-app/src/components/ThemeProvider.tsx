"use client";

import { useEffect } from "react";
import { useThemeStore, getSystemTheme, applyTheme } from "@/lib/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const { theme: t } = useThemeStore.getState();
      if (t === "system") {
        const resolved = getSystemTheme();
        applyTheme(resolved);
        useThemeStore.setState({ resolvedTheme: resolved });
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return <>{children}</>;
}
