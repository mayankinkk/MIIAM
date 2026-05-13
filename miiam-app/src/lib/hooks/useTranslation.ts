"use client";

import { useLanguageStore, Language } from "@/lib/store/languageStore";
import { translations, Translations } from "@/lib/i18n/translations";

type TranslationKey = keyof Translations;

const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  as: "অসমীয়া",
};

const languageFlags: Record<Language, string> = {
  en: "🇮🇳",
  hi: "🇮🇳",
  as: "🇮🇳",
};

export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const getAvailableLanguages = (): { code: Language; name: string; flag: string }[] => {
    return Object.keys(translations).map((code) => ({
      code: code as Language,
      name: languageNames[code as Language],
      flag: languageFlags[code as Language],
    }));
  };

  const getCurrentLanguage = (): { code: Language; name: string; flag: string } => ({
    code: language,
    name: languageNames[language],
    flag: languageFlags[language],
  });

  return {
    t,
    language,
    setLanguage,
    getAvailableLanguages,
    getCurrentLanguage,
    availableLanguages: Object.keys(translations) as Language[],
  };
}

export type { Language, TranslationKey };