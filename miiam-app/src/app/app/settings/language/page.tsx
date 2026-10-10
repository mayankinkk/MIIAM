"use client";

import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const LANGUAGES = [
  { code: "en" as const, label: "English", native: "English", flag: "🇺🇸" },
  { code: "hi" as const, label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "bn" as const, label: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "as" as const, label: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
];

export default function LanguagePage() {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

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
          <h1 className="text-on-background text-xl font-black">{t.settings.language}</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/app/home" },
          { label: t.settings.title, href: "/app/settings" },
          { label: t.settings.language },
        ]}
      />

      <main className="p-6">
        <p className="text-on-surface-variant mb-6 text-sm">{t.settings.languageDescription}</p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`bg-surface-container border-outline-variant/10 flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                language === lang.code ? "border-primary shadow-md" : "border-transparent"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p
                  className={`font-bold ${language === lang.code ? "text-accent" : "text-on-surface"}`}
                >
                  {lang.native}
                </p>
                <p className="text-on-surface-variant text-xs">{lang.label}</p>
              </div>
              {language === lang.code && (
                <span className="material-symbols-outlined text-accent">check_circle</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-surface-container-low border-outline-variant/20 mt-6 rounded-2xl border p-4">
          <p className="text-on-surface-variant flex items-center gap-1 text-xs font-bold">
            <span className="material-symbols-outlined text-accent text-sm">info</span>
            {t.settings.note}
          </p>
        </div>
      </main>
    </div>
  );
}
