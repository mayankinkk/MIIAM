"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "./index";
import type { Translations } from "./en";

let cachedTranslations: Record<string, Translations> = {};

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const [t, setT] = useState<Translations>(() => cachedTranslations[language] || cachedTranslations["en"]);

  useEffect(() => {
    const cacheKey = language;
    if (cachedTranslations[cacheKey]) {
      setT(cachedTranslations[cacheKey]);
      return;
    }
    getTranslations(language).then((translations) => {
      cachedTranslations[cacheKey] = translations;
      setT(translations);
    });
  }, [language]);

  return { t, language };
}
