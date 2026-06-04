"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PrintFirstOrderCoupon({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base leading-tight">{t.print.couponBanner}</p>
          <p className="text-xs text-white/90 mt-0.5 leading-snug">{t.print.couponBody}</p>
        </div>
        <button
          onClick={onClick}
          className="bg-white text-orange-600 px-3 py-2 rounded-xl text-xs font-black flex-shrink-0 hover:bg-white/90"
        >
          {t.print.couponCta}
        </button>
      </div>
    </div>
  );
}
