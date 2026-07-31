"use client";

import { RiderTipSelector, TipThankYou } from "@/components/RiderTip";

interface CheckoutRiderTipProps {
  showTipSelector: boolean;
  tipAmount: number;
  onTipSelect: (amount: number) => void;
  onSkipTip: () => void;
  onEditTip: () => void;
  subtotal: number;
}

export default function CheckoutRiderTip({ showTipSelector, tipAmount, onTipSelect, onSkipTip, onEditTip, subtotal }: CheckoutRiderTipProps) {
  return (
    <div className="py-3 border-t border-dashed border-outline-variant/30">
      {showTipSelector ? (
        <RiderTipSelector
          orderAmount={subtotal}
          onTipSelect={onTipSelect}
          onSkip={onSkipTip}
        />
      ) : tipAmount > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-on-surface">Rider Tip</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">₹{tipAmount}</span>
              <button onClick={onEditTip} className="text-xs text-blue-600 underline">Edit</button>
            </div>
          </div>
          <TipThankYou amount={tipAmount} />
        </div>
      ) : (
        <button
          onClick={onEditTip}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">favorite</span>
          Add tip for your rider
        </button>
      )}
    </div>
  );
}
