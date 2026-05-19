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
    <div className="min-h-screen bg-[#fff4f4] dark:bg-slate-950 pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined dark:text-white">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a] dark:text-white">Appearance</h1>
        </div>
      </header>

      <main className="p-6 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose how MIIAM looks on this device.</p>
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              theme === t.value
                ? "border-[#ba001c] bg-white dark:bg-slate-900 shadow-md"
                : "border-transparent bg-white dark:bg-slate-900 opacity-70"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === t.value ? "bg-[#ba001c] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              <span className="material-symbols-outlined text-2xl">{t.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className={`font-bold ${theme === t.value ? "text-[#ba001c]" : "text-slate-800 dark:text-white"}`}>{t.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.sub}</p>
            </div>
            {theme === t.value && (
              <span className="material-symbols-outlined text-[#ba001c]">check_circle</span>
            )}
          </button>
        ))}

        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Preview</p>
          <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-slate-800" : "bg-[#fff4f4]"}`}>
            <div className={`h-3 w-24 rounded-full mb-2 ${theme === "dark" ? "bg-slate-600" : "bg-slate-200"}`} />
            <div className={`h-3 w-40 rounded-full mb-2 ${theme === "dark" ? "bg-slate-600" : "bg-slate-200"}`} />
            <div className="h-8 w-28 bg-[#ba001c] rounded-lg mt-3" />
          </div>
        </div>
      </main>
    </div>
  );
}
