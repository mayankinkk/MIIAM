"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useThemeStore } from "@/lib/store/themeStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

const themes = [
  { value: "light" as const, icon: "light_mode", label: "Light", sub: "Always use light theme" },
  { value: "dark" as const, icon: "dark_mode", label: "Dark", sub: "Always use dark theme" },
  {
    value: "system" as const,
    icon: "brightness_auto",
    label: "System",
    sub: "Follow device setting",
  },
];

export default function ThemePage() {
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  useEffect(() => {
    // Apply theme on mount
    setTheme(theme);
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      <header className="bg-surface-container border-outline-variant/10 sticky top-0 z-10 border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/app/settings"
            className="bg-surface-container-high hover:bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-on-background text-xl font-black">{t.settings.theme}</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/app/home" },
          { label: t.settings.title, href: "/app/settings" },
          { label: t.settings.theme },
        ]}
      />

      <main className="space-y-4 p-6">
        <p className="text-on-surface-variant mb-6 text-sm">{t.settings.themeSub}</p>
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
              theme === t.value
                ? "border-primary bg-surface-container shadow-md"
                : "bg-surface-container border-transparent opacity-70"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                theme === t.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{t.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className={`font-bold ${theme === t.value ? "text-accent" : "text-on-surface"}`}>
                {t.label}
              </p>
              <p className="text-on-surface-variant text-xs">{t.sub}</p>
            </div>
            {theme === t.value && (
              <span className="material-symbols-outlined text-accent">check_circle</span>
            )}
          </button>
        ))}

        <div className="bg-surface-container border-outline-variant/10 mt-8 rounded-2xl border p-5 shadow-sm">
          <p className="text-on-surface-variant mb-2 text-xs font-black tracking-widest uppercase">
            Preview
          </p>
          <div
            className={`border-outline-variant/10 rounded-xl border p-4 ${theme === "dark" ? "bg-surface-container-lowest" : "bg-surface"}`}
          >
            <div
              className={`mb-2 h-3 w-24 rounded-full ${theme === "dark" ? "bg-surface-bright" : "bg-surface-container"}`}
            />
            <div
              className={`mb-2 h-3 w-40 rounded-full ${theme === "dark" ? "bg-surface-bright" : "bg-surface-container"}`}
            />
            <div className="bg-primary mt-3 h-8 w-28 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
