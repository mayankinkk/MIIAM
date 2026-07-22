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
        <div className="flex items-center justify-between bg-status-success/10 dark:bg-status-success/20 border border-status-success/20 dark:border-status-success/40 p-3 sm:p-4 rounded-xl gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-status-success shrink-0">local_offer</span>
            <div className="min-w-0">
              <p className="font-bold text-status-success truncate">{promoApplied.code}</p>
              <p className="text-xs text-status-success">-{promoApplied.type === "percent" ? `${promoApplied.discount}%` : `₹${promoApplied.discount}`}</p>
            </div>
          </div>
          <button onClick={onRemovePromo} className="text-status-success text-sm font-bold shrink-0">Remove</button>
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
