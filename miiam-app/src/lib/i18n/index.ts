import type { Translations } from "./en";
import type { Language } from "@/lib/store/languageStore";

let cachedEn: Translations | null = null;
const syncCache: Partial<Record<Language, Translations>> = {};

async function loadTranslations(lang: Language): Promise<Translations> {
  if (lang === "en") {
    if (!cachedEn) {
      cachedEn = (await import("./en")).default;
      syncCache.en = cachedEn;
    }
    return cachedEn;
  }
  if (syncCache[lang]) return syncCache[lang]!;
  switch (lang) {
    case "hi": syncCache.hi = (await import("./hi")).default; return syncCache.hi!;
    case "bn": syncCache.bn = (await import("./bn")).default; return syncCache.bn!;
    case "as": syncCache.as = (await import("./as")).default; return syncCache.as!;
    default: {
      if (!cachedEn) {
        cachedEn = (await import("./en")).default;
        syncCache.en = cachedEn;
      }
      return cachedEn;
    }
  }
}

export async function getTranslations(lang: Language): Promise<Translations> {
  return loadTranslations(lang);
}

export function getTranslationsSync(lang: Language): Translations {
  if (syncCache[lang]) return syncCache[lang]!;
  loadTranslations(lang);
  return syncCache.en || ({} as Translations);
}

export type { Translations };
