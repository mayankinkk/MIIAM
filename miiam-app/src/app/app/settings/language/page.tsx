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
    <div className="min-h-screen bg-[#fff4f4] dark:bg-slate-950 pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a] dark:text-white">Language</h1>
        </div>
      </header>

      <main className="p-6">
        <p className="text-sm text-slate-500 mb-6">Choose your preferred language. UI text will update immediately.</p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as "en" | "hi")}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white dark:bg-slate-900 ${
                language === lang.code ? "border-[#ba001c] shadow-md" : "border-transparent"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className={`font-bold ${language === lang.code ? "text-[#ba001c]" : "text-slate-800 dark:text-white"}`}>
                  {lang.native}
                </p>
                <p className="text-xs text-slate-500">{lang.label}</p>
              </div>
              {language === lang.code && (
                <span className="material-symbols-outlined text-[#ba001c]">check_circle</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Some content like restaurant names is always shown in its original language.
          </p>
        </div>
      </main>
    </div>
  );
}
