import en from "./en";
import hi from "./hi";
import type { Translations } from "./en";
import type { Language } from "@/lib/store/languageStore";

const translations: Record<Language, Translations> = { en, hi, as: en };

export function getTranslations(lang: Language): Translations {
  return translations[lang] || en;
}

export type { Translations };
export { en, hi };
