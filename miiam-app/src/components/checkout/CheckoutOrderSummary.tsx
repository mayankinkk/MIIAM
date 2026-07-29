"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CartItem } from "@/lib/store/cartStore";
import CheckoutRiderTip from "./CheckoutRiderTip";

interface FeeLine {
  label: string;
  sub: string;
  amount: number;
  icon: string;
}

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalDeliveryFee: number;
  totalServiceCharge: number;
  gstAmount: number;
  packagingFee: number;
  platformFee: number;
  grand: number;
  /** Rider tip props */
  showTipSelector: boolean;
  tipAmount: number;
  onTipSelect: (amount: number) => void;
  onSkipTip: () => void;
  onEditTip: () => void;
}

export default function CheckoutOrderSummary({
  items, subtotal, discount, totalDeliveryFee, totalServiceCharge, gstAmount, packagingFee, platformFee, grand,
  showTipSelector, tipAmount, onTipSelect, onSkipTip, onEditTip,
}: CheckoutOrderSummaryProps) {
  const { t } = useTranslation();

  const fees: FeeLine[] = [
    { label: "Service Charge", sub: "For keeping the lights on", amount: totalServiceCharge, icon: "lightbulb" },
    { label: "Packaging", sub: "Keeping your food warm & cozy", amount: packagingFee, icon: "inventory_2" },
    { label: "Delivery Fees (Why this?)", sub: "On us!", amount: totalDeliveryFee, icon: "delivery_dining" },
    { label: "Platform Fee", sub: "On us!", amount: platformFee, icon: "computer" },
    { label: "GST (5%)", sub: "On us!", amount: gstAmount, icon: "account_balance" },
  ];

  return (
    <>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
      <h2 className="text-xl sm:text-2xl font-extrabold mb-6 sm:mb-8 tracking-tight">{t.checkout.orderSummary}</h2>
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        {/* Items */}
        <div className="flex justify-between text-on-surface-variant">
          <span>Items ({items.length})</span>
          <span className="font-semibold text-on-surface">₹{subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t.checkout.discount}</span>
            <span className="font-semibold">-₹{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Fun Fee Breakdown */}
        <div className="bg-surface-container-lowest/60 rounded-xl p-3 space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-2">Where your money goes</p>
          {fees.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-on-surface font-medium text-xs">{f.label}</p>
                <p className="text-[10px] text-on-surface-variant/60 truncate">{f.sub}</p>
              </div>
              <span className="font-semibold text-on-surface text-xs tabular-nums">
                {f.amount === 0 ? "FREE" : `₹${f.amount.toFixed(2)}`}
              </span>
            </div>
          ))}
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
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Inclusive of all taxes</p>
          </div>
        </div>
      </div>
    </>
  );
}
