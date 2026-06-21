"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface PromoApplied {
  code: string;
  discount: number;
  type: "percent" | "flat";
}

interface CheckoutPromoCodeProps {
  promoApplied: PromoApplied | null;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  promoError: string;
}

export default function CheckoutPromoCode({ promoApplied, promoCode, onPromoCodeChange, onApplyPromo, onRemovePromo, promoError }: CheckoutPromoCodeProps) {
  const { t } = useTranslation();

  return (
    <>
      {promoApplied ? (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 sm:p-4 rounded-xl gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 shrink-0">local_offer</span>
            <div className="min-w-0">
              <p className="font-bold text-green-700 dark:text-green-300 truncate">{promoApplied.code}</p>
              <p className="text-xs text-green-600 dark:text-green-400">-{promoApplied.type === "percent" ? `${promoApplied.discount}%` : `₹${promoApplied.discount}`}</p>
            </div>
          </div>
          <button onClick={onRemovePromo} className="text-green-700 dark:text-green-300 text-sm font-bold shrink-0">Remove</button>
        </div>
      ) : (
        <div className="relative">
          <input
            className="w-full bg-[var(--color-surface-container-lowest)] border-none rounded-xl py-3.5 sm:py-4 pl-3 sm:pl-4 pr-24 sm:pr-32 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
            placeholder="Promo Code"
            value={promoCode}
            onChange={(e) => { onPromoCodeChange(e.target.value); }}
            type="text"
          />
          <button
            onClick={onApplyPromo}
            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-4 bg-on-surface text-white rounded-lg font-bold text-xs hover:bg-black transition-colors"
          >
            APPLY
          </button>
        </div>
      )}
      {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
      <p className="text-xs text-on-surface-variant mt-2">Try: FIRST50, MIIAM20, SAVE50</p>
    </>
  );
}
