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
  items,
  subtotal,
  discount,
  totalDeliveryFee,
  totalServiceCharge,
  gstAmount,
  packagingFee,
  platformFee,
  grand,
  showTipSelector,
  tipAmount,
  onTipSelect,
  onSkipTip,
  onEditTip,
}: CheckoutOrderSummaryProps) {
  const { t } = useTranslation();

  const fees: FeeLine[] = [
    {
      label: "Service Charge",
      sub: "For keeping the lights on",
      amount: totalServiceCharge,
      icon: "lightbulb",
    },
    {
      label: "Packaging",
      sub: "Keeping your food warm & cozy",
      amount: packagingFee,
      icon: "inventory_2",
    },
    {
      label: "Delivery Fees (Why this?)",
      sub: "On us!",
      amount: totalDeliveryFee,
      icon: "delivery_dining",
    },
    { label: "Platform Fee", sub: "On us!", amount: platformFee, icon: "computer" },
    { label: "GST (5%)", sub: "On us!", amount: gstAmount, icon: "account_balance" },
  ];

  return (
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-accent text-[20px]">receipt_long</span>
        <h2 className="text-on-surface text-[15px] font-bold">{t.checkout.orderSummary}</h2>
      </div>

      <div className="space-y-2.5">
        {/* Items */}
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-on-surface-variant">
            {t.checkout.itemsLabel.replace("{count}", String(items.length))}
          </span>
          <span className="text-on-surface font-semibold">₹{subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-accent">{t.checkout.discount}</span>
            <span className="text-accent font-semibold">-₹{discount.toFixed(2)}</span>
          </div>
        )}

        {/* Fee breakdown */}
        <div className="border-outline-variant/40 space-y-2.5 border-t border-dashed pt-2.5">
          {fees.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="text-on-surface text-[13px] font-medium">{f.label}</p>
                <p className="text-on-surface-variant/70 text-[10px]">{f.sub}</p>
              </div>
              <span
                className={`shrink-0 text-[13px] font-semibold tabular-nums ${f.amount === 0 ? "text-accent" : "text-on-surface"}`}
              >
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
        <div className="border-outline-variant/40 flex items-end justify-between gap-2 border-t pt-3">
          <div className="min-w-0">
            <p className="text-on-surface text-sm font-bold">{t.checkout.totalAmount}</p>
            <p className="text-on-surface-variant text-[10px] font-bold tracking-wider uppercase">
              {t.checkout.incTaxes}
            </p>
          </div>
          <p className="text-on-surface truncate text-xl font-black tabular-nums">
            ₹{grand.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="text-on-surface-variant mt-3 flex items-center justify-center gap-1.5 text-center text-xs">
        <span className="material-symbols-outlined text-sm">lock</span>
        {t.checkout.securePayment}
      </p>
    </section>
  );
}
