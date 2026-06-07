import en from "./en";
import hi from "./hi";
import as from "./as";
import bn from "./bn";
import type { Translations } from "./en";
import type { Language } from "@/lib/store/languageStore";

const translations: Record<Language, Translations> = { en, hi, as, bn };

export function getTranslations(lang: Language): Translations {
  return translations[lang] || en;
}

export type { Translations };
export { en, hi, as, bn };
