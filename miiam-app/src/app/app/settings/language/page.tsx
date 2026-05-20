"use client";

import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇺🇸" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
];

export default function LanguagePage() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-background">Language</h1>
        </div>
      </header>

      <main className="p-6">
        <p className="text-sm text-on-surface-variant mb-6">Choose your preferred language. UI text will update immediately.</p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as "en" | "hi")}
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
            Some content like restaurant names is always shown in its original language.
          </p>
        </div>
      </main>
    </div>
  );
}
