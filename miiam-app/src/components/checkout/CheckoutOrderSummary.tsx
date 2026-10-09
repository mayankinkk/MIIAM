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
    <section className="px-4 py-4 border-b border-outline-variant/60">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-accent text-[20px]">receipt_long</span>
        <h2 className="text-[15px] font-bold text-on-surface">{t.checkout.orderSummary}</h2>
      </div>

      <div className="space-y-2.5">
        {/* Items */}
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-on-surface-variant">Items ({items.length})</span>
          <span className="font-semibold text-on-surface">₹{subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-accent">{t.checkout.discount}</span>
            <span className="font-semibold text-accent">-₹{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Fee breakdown */}
        <div className="pt-2.5 border-t border-dashed border-outline-variant/40 space-y-2.5">
          {fees.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="text-on-surface font-medium text-[13px]">{f.label}</p>
                <p className="text-[10px] text-on-surface-variant/70">{f.sub}</p>
              </div>
              <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${f.amount === 0 ? "text-accent" : "text-on-surface"}`}>
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
        <div className="pt-3 border-t border-outline-variant/40 flex justify-between items-end gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface">{t.checkout.totalAmount}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{t.checkout.incTaxes}</p>
          </div>
          <p className="text-xl font-black text-on-surface tabular-nums truncate">₹{grand.toFixed(2)}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-on-surface-variant flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-sm">lock</span>
        {t.checkout.securePayment}
      </p>
    </section>
  );
}
