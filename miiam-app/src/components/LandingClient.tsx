"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslationsSync } from "@/lib/i18n";
import type { Translations } from "@/lib/i18n";

export default function LandingClient({ children }: { children: (t: Translations["landing"]) => React.ReactNode }) {
  const language = useLanguageStore((s) => s.language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = mounted ? getTranslationsSync(language).landing : getTranslationsSync("en").landing;

  return <>{children(t)}</>;
}
