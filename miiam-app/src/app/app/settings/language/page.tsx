"use client";

import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const LANGUAGES = [
  { code: "en" as const, label: "English", native: "English", flag: "🇺🇸" },
  { code: "hi" as const, label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "bn" as const, label: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "as" as const, label: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
];

export default function LanguagePage() {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-background">{t.settings.language}</h1>
        </div>
      </header>

      <Breadcrumbs items={[{ label: t.common.home, href: '/app/explore' }, { label: t.settings.title, href: '/app/settings' }, { label: t.settings.language }]} />

      <main className="p-6">
        <p className="text-sm text-on-surface-variant mb-6">{t.settings.languageDescription}</p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-surface-container border-outline-variant/10 ${
                language === lang.code ? "border-primary shadow-md" : "border-transparent"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className={`font-bold ${language === lang.code ? "text-primary" : "text-on-surface"}`}>
                  {lang.native}
                </p>
                <p className="text-xs text-on-surface-variant">{lang.label}</p>
              </div>
              {language === lang.code && (
                <span className="material-symbols-outlined text-primary">check_circle</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">info</span>
            {t.settings.note}
          </p>
        </div>
      </main>
    </div>
  );
}
