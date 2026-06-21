"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "./index";
import type { Translations } from "./en";
import en from "./en";

const cachedTranslations: Record<string, Translations> = { en };

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const [t, setT] = useState<Translations>(() => cachedTranslations[language] || en);

  useEffect(() => {
    if (cachedTranslations[language]) {
      setT(cachedTranslations[language]);
      return;
    }
    getTranslations(language).then((translations) => {
      cachedTranslations[language] = translations;
      setT(translations);
    });
  }, [language]);

  return { t, language };
}
