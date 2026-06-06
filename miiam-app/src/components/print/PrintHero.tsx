"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { useUiA11yStore } from "@/lib/store/uiA11yStore";
import { getPrintingPricing } from "@/lib/printing-pricing";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface PrintHeroProps {
  showBackLink?: boolean;
  backHref?: string;
}

export default function PrintHero({ showBackLink = true, backHref = "/app/home" }: PrintHeroProps) {
  const { t } = useTranslation();
  const isServiceOpenNow = useServiceSettingsStore((s) => s.isServiceOpenNow);
  const formatServiceHours = useServiceSettingsStore((s) => s.formatServiceHours);
  const contrast = useUiA11yStore((s) => s.contrast);
  const theme = useUiA11yStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const pricing = typeof window !== "undefined" ? getPrintingPricing() : { bwPerPage: 2, colorPerPage: 10, glossySurcharge: 5, a3Surcharge: 3 };
  const isOpen = isServiceOpenNow("printing");
  const hours = formatServiceHours("printing");

  const isDark = mounted && (theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  const isHigh = mounted && contrast === "high";

  const baseClasses = isHigh
    ? "px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10 bg-indigo-700 text-white border-b-4 border-yellow-300"
    : isDark
    ? "px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white"
    : "px-4 sm:px-6 pt-6 sm:pt-8 pb-8 sm:pb-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white";

  return (
    <div className={baseClasses}>
      {showBackLink && (
        <Link
          href={backHref}
          className="text-white/80 font-bold mb-4 block hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700 rounded"
        >
          ← {t.common.back}
        </Link>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isHigh ? "bg-yellow-300 text-indigo-900" : "bg-white/20"}`}>
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">print</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black break-words">{t.print.heroTitle}</h1>
          <p className="text-white/80 text-sm break-words">{t.print.heroSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className={`inline-flex items-center gap-1 min-w-0 max-w-full whitespace-nowrap ${isHigh ? "bg-yellow-300 text-indigo-900" : "bg-white/95 text-indigo-700"} text-xs font-black px-3 py-1.5 rounded-full shadow-sm`}>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">payments</span>
          {t.print.pricingChip
            .replace("{bw}", String(pricing.bwPerPage))
            .replace("{color}", String(pricing.colorPerPage))}
          <span className={isHigh ? "text-indigo-900" : "text-indigo-500"}>{t.print.pricingChipPer}</span>
        </span>

        <span className="inline-flex items-center gap-1 whitespace-nowrap bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">bolt</span>
          {hours === "24×7" ? t.print.serviceHours247 : t.print.serviceHoursLabel + " " + hours}
        </span>

        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap ${
            isOpen ? "bg-emerald-400/30" : "bg-amber-300/30"
          } text-white text-xs font-bold px-3 py-1.5 rounded-full`}
          role="status"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOpen ? "bg-emerald-200 animate-pulse" : "bg-amber-200"
            }`}
            aria-hidden="true"
          />
          {isOpen ? t.print.serviceHoursOpen : t.print.serviceHoursClosed}
        </span>

        <span className="inline-flex items-center gap-1 whitespace-nowrap bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
          {t.print.noMinimum}
        </span>
      </div>
    </div>
  );
}
