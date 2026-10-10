"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { RiderTipSelector, TipThankYou } from "@/components/RiderTip";

interface CheckoutRiderTipProps {
  showTipSelector: boolean;
  tipAmount: number;
  onTipSelect: (amount: number) => void;
  onSkipTip: () => void;
  onEditTip: () => void;
  subtotal: number;
}

export default function CheckoutRiderTip({
  showTipSelector,
  tipAmount,
  onTipSelect,
  onSkipTip,
  onEditTip,
  subtotal,
}: CheckoutRiderTipProps) {
  const { t } = useTranslation();
  return (
    <div className="border-outline-variant/30 border-t border-dashed py-3">
      {showTipSelector ? (
        <RiderTipSelector orderAmount={subtotal} onTipSelect={onTipSelect} onSkip={onSkipTip} />
      ) : tipAmount > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface font-bold">{t.checkout.riderTip}</span>
            <div className="flex items-center gap-2">
              <span className="text-on-surface font-semibold">₹{tipAmount}</span>
              <button onClick={onEditTip} className="text-accent text-xs underline">
                {t.checkout.edit}
              </button>
            </div>
          </div>
          <TipThankYou amount={tipAmount} />
        </div>
      ) : (
        <button
          onClick={onEditTip}
          className="text-on-surface-variant hover:text-accent flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">favorite</span>
          Add tip for your rider
        </button>
      )}
    </div>
  );
}
