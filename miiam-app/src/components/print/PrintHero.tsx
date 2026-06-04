"use client";

import Link from "next/link";
import { useServiceSettingsStore, isServiceOpen } from "@/lib/store/serviceSettingsStore";
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

  const pricing = typeof window !== "undefined" ? getPrintingPricing() : { bwPerPage: 2, colorPerPage: 10, glossySurcharge: 5, a3Surcharge: 3 };
  const isOpen = isServiceOpenNow("printing");
  const hours = formatServiceHours("printing");

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-8 pb-10">
      {showBackLink && (
        <Link
          href={backHref}
          className="text-white/80 font-bold mb-4 block hover:text-white"
        >
          ← {t.common.back}
        </Link>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-2xl">print</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{t.print.heroTitle}</h1>
          <p className="text-white/80 text-sm">{t.print.heroSubtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="inline-flex items-center gap-1 bg-white/95 text-indigo-700 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          {t.print.pricingChip
            .replace("{bw}", String(pricing.bwPerPage))
            .replace("{color}", String(pricing.colorPerPage))}
          <span className="text-indigo-500">{t.print.pricingChipPer}</span>
        </span>

        <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          {hours === "24×7" ? t.print.serviceHours247 : t.print.serviceHoursLabel + " " + hours}
        </span>

        <span
          className={`inline-flex items-center gap-1 ${
            isOpen ? "bg-emerald-400/30" : "bg-amber-300/30"
          } text-white text-xs font-bold px-3 py-1.5 rounded-full`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOpen ? "bg-emerald-200 animate-pulse" : "bg-amber-200"
            }`}
          />
          {isOpen ? t.print.serviceHoursOpen : t.print.serviceHoursClosed}
        </span>

        <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {t.print.noMinimum}
        </span>
      </div>
    </div>
  );
}
