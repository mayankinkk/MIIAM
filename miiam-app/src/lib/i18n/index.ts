import en from "./en";
import type { Translations } from "./en";
import type { Language } from "@/lib/store/languageStore";

const syncCache: Partial<Record<Language, Translations>> = { en };

async function loadTranslations(lang: Language): Promise<Translations> {
  if (syncCache[lang]) return syncCache[lang]!;
  switch (lang) {
    case "hi": syncCache.hi = (await import("./hi")).default; return syncCache.hi!;
    case "bn": syncCache.bn = (await import("./bn")).default; return syncCache.bn!;
    case "as": syncCache.as = (await import("./as")).default; return syncCache.as!;
    default: return en;
  }
}

export async function getTranslations(lang: Language): Promise<Translations> {
  return loadTranslations(lang);
}

export function getTranslationsSync(lang: Language): Translations {
  if (syncCache[lang]) return syncCache[lang]!;
  loadTranslations(lang);
  return en;
}

export type { Translations };
