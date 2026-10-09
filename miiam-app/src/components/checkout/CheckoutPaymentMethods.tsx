"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CheckoutPaymentMethodsProps {
  paymentMethod: string;
  onChange: (method: string) => void;
}

export default function CheckoutPaymentMethods({ paymentMethod, onChange }: CheckoutPaymentMethodsProps) {
  const { t } = useTranslation();

  const methods = [
    { id: "cod", label: t.checkout.cashOnDelivery, sub: t.checkout.codDesc, icon: "payments" },
  ];

  return (
    <section className="px-4 py-4 border-b border-outline-variant/60">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-accent text-[20px]">payments</span>
        <h2 className="text-[15px] font-bold text-on-surface">{t.checkout.paymentMethod}</h2>
      </div>
      <div className="divide-y divide-outline-variant/40">
        {methods.map((pm) => (
          <label
            key={pm.id}
            className={`flex items-center gap-3 py-3 cursor-pointer transition-colors ${
              paymentMethod === pm.id ? "" : "opacity-70 hover:opacity-100"
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === pm.id}
              onChange={() => onChange(pm.id)}
              className="w-5 h-5 text-accent accent-[var(--color-accent)] shrink-0"
            />
            <span className="material-symbols-outlined text-on-surface-variant shrink-0">{pm.icon}</span>
            <div className="min-w-0">
              <p className={`text-sm truncate ${paymentMethod === pm.id ? "font-bold text-on-surface" : "font-medium text-on-surface"}`}>{pm.label}</p>
              <p className="text-xs text-on-surface-variant truncate">{pm.sub}</p>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
