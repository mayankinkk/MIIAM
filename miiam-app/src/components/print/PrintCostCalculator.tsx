"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getPrintingPricing, type PrintingPricing } from "@/lib/printing-pricing";
import Link from "next/link";

interface PrintCostCalculatorProps {
  variant?: "card" | "inline";
  onCta?: () => void;
  ctaHref?: string;
  className?: string;
}

export default function PrintCostCalculator({
  variant = "card",
  onCta,
  ctaHref = "/app/printing",
  className = "",
}: PrintCostCalculatorProps) {
  const { t } = useTranslation();
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [mode, setMode] = useState<"bw" | "color">("bw");

  const pricing: PrintingPricing = useMemo(() => {
    if (typeof window === "undefined") {
      return { bwPerPage: 2, colorPerPage: 10, glossySurcharge: 5, a3Surcharge: 3 };
    }
    return getPrintingPricing();
  }, []);

  const perPage = mode === "bw" ? pricing.bwPerPage : pricing.colorPerPage;
  const total = pages * copies * perPage;

  const isCard = variant === "card";

  return (
    <div
      className={`${
        isCard
          ? "bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm"
          : "w-full"
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-lg">calculate</span>
        <h3 className="font-bold text-on-surface">{t.print.calculatorTitle}</h3>
      </div>
      <p className="text-xs text-on-surface-variant mb-4">{t.print.calculatorSubtitle}</p>

      <div className="space-y-3">
        <div className="flex gap-2 p-1 bg-surface-container-high rounded-xl">
          <button
            onClick={() => setMode("bw")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
              mode === "bw" ? "bg-primary text-white" : "text-on-surface-variant"
            }`}
          >
            {t.print.calculatorBW} · ₹{pricing.bwPerPage}
          </button>
          <button
            onClick={() => setMode("color")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
              mode === "color" ? "bg-primary text-white" : "text-on-surface-variant"
            }`}
          >
            {t.print.calculatorColor} · ₹{pricing.colorPerPage}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-on-surface-variant block mb-1">
              {t.print.calculatorPages}
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={pages}
              onChange={(e) => setPages(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
              className="w-full p-2.5 bg-surface-container-high rounded-xl border border-outline-variant text-center font-bold"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant block mb-1">
              {t.print.calculatorCopies}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full p-2.5 bg-surface-container-high rounded-xl border border-outline-variant text-center font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
          <span className="text-sm font-bold text-indigo-900">{t.print.calculatorEstimated}</span>
          <span className="text-xl font-black text-primary">₹{total}</span>
        </div>

        {onCta ? (
          <button
            onClick={onCta}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
          >
            {t.print.calculatorCta} →
          </button>
        ) : (
          <Link
            href={ctaHref}
            className="block w-full py-3 bg-primary text-white rounded-xl font-bold text-center hover:bg-primary/90"
          >
            {t.print.calculatorCta} →
          </Link>
        )}
      </div>
    </div>
  );
}
