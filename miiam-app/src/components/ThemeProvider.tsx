"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  useEffect(() => {
    setTheme(theme);
  }, []);

  useEffect(() => {
    const handleChange = () => {
      if (theme === "system") {
        setTheme("system");
      }
    };
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, setTheme]);

  return <>{children}</>;
}