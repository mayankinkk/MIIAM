"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CheckoutPaymentMethodsProps {
  paymentMethod: string;
  onChange: (method: string) => void;
}

export default function CheckoutPaymentMethods({
  paymentMethod,
  onChange,
}: CheckoutPaymentMethodsProps) {
  const { t } = useTranslation();

  const methods = [
    { id: "cod", label: t.checkout.cashOnDelivery, sub: t.checkout.codDesc, icon: "payments" },
  ];

  return (
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-accent text-[20px]">payments</span>
        <h2 className="text-on-surface text-[15px] font-bold">{t.checkout.paymentMethod}</h2>
      </div>
      <div className="divide-outline-variant/40 divide-y">
        {methods.map((pm) => (
          <label
            key={pm.id}
            className={`flex cursor-pointer items-center gap-3 py-3 transition-colors ${
              paymentMethod === pm.id ? "" : "opacity-70 hover:opacity-100"
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === pm.id}
              onChange={() => onChange(pm.id)}
              className="text-accent h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="material-symbols-outlined text-on-surface-variant shrink-0">
              {pm.icon}
            </span>
            <div className="min-w-0">
              <p
                className={`truncate text-sm ${paymentMethod === pm.id ? "text-on-surface font-bold" : "text-on-surface font-medium"}`}
              >
                {pm.label}
              </p>
              <p className="text-on-surface-variant truncate text-xs">{pm.sub}</p>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
