"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CartItem } from "@/lib/store/cartStore";
import CheckoutRiderTip from "./CheckoutRiderTip";

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalDeliveryFee: number;
  vendorIds: string[];
  serviceCharge: number;
  grand: number;
  /** Rider tip props */
  showTipSelector: boolean;
  tipAmount: number;
  onTipSelect: (amount: number) => void;
  onSkipTip: () => void;
  onEditTip: () => void;
}

export default function CheckoutOrderSummary({
  items, subtotal, discount, totalDeliveryFee, vendorIds, serviceCharge, grand,
  showTipSelector, tipAmount, onTipSelect, onSkipTip, onEditTip,
}: CheckoutOrderSummaryProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
      <h2 className="text-xl sm:text-2xl font-extrabold mb-6 sm:mb-8 tracking-tight">{t.checkout.orderSummary}</h2>
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <div className="flex justify-between text-on-surface-variant">
          <span>Subtotal ({items.length} items)</span>
          <span className="font-semibold text-on-surface">₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t.checkout.discount}</span>
            <span className="font-semibold">-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-on-surface-variant">
          <span>Delivery Fee</span>
          <span className={`font-semibold ${totalDeliveryFee === 0 ? "text-green-600" : "text-on-surface"}`}>
            {totalDeliveryFee === 0 ? "FREE" : `₹${totalDeliveryFee.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Service Charge</span>
          <span className="font-semibold text-on-surface">₹{(vendorIds.length * serviceCharge).toFixed(2)}</span>
        </div>

        {/* Rider Tip */}
        <CheckoutRiderTip
          showTipSelector={showTipSelector}
          tipAmount={tipAmount}
          onTipSelect={onTipSelect}
          onSkipTip={onSkipTip}
          onEditTip={onEditTip}
          subtotal={subtotal}
        />

        {/* Total */}
        <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end gap-2">
          <span className="text-base sm:text-lg font-bold">{t.checkout.totalAmount}</span>
          <div className="text-right min-w-0">
            <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tighter truncate">₹{grand}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{t.checkout.incTaxes}</p>
          </div>
        </div>
      </div>
    </>
  );
}
