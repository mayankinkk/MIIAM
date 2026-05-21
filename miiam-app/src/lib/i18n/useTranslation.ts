import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "./index";

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const t = getTranslations(language);
  return { t, language };
}
