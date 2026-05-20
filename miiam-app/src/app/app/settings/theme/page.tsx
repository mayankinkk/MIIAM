"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useThemeStore } from "@/lib/store/themeStore";

const themes = [
  { value: "light" as const, icon: "light_mode", label: "Light", sub: "Always use light theme" },
  { value: "dark" as const, icon: "dark_mode", label: "Dark", sub: "Always use dark theme" },
  { value: "system" as const, icon: "brightness_auto", label: "System", sub: "Follow device setting" },
];

export default function ThemePage() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    setTheme(theme);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-background">Appearance</h1>
        </div>
      </header>

      <main className="p-6 space-y-4">
        <p className="text-sm text-on-surface-variant mb-6">Choose how MIIAM looks on this device.</p>
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              theme === t.value
                ? "border-primary bg-surface-container shadow-md"
                : "border-transparent bg-surface-container opacity-70"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === t.value ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
            }`}>
              <span className="material-symbols-outlined text-2xl">{t.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className={`font-bold ${theme === t.value ? "text-primary" : "text-on-surface"}`}>{t.label}</p>
              <p className="text-xs text-on-surface-variant">{t.sub}</p>
            </div>
            {theme === t.value && (
              <span className="material-symbols-outlined text-primary">check_circle</span>
            )}
          </button>
        ))}

        <div className="mt-8 bg-surface-container border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">Preview</p>
          <div className={`rounded-xl p-4 border border-outline-variant/10 ${theme === "dark" ? "bg-[#0f0506]" : "bg-[#fff4f4]"}`}>
            <div className={`h-3 w-24 rounded-full mb-2 ${theme === "dark" ? "bg-[#240b0e]" : "bg-[#ffe1e4]"}`} />
            <div className={`h-3 w-40 rounded-full mb-2 ${theme === "dark" ? "bg-[#240b0e]" : "bg-[#ffe1e4]"}`} />
            <div className="h-8 w-28 bg-primary rounded-lg mt-3" />
          </div>
        </div>
      </main>
    </div>
  );
}
