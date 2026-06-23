"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CheckoutPaymentMethodsProps {
  paymentMethod: string;
  onChange: (method: string) => void;
}

export default function CheckoutPaymentMethods({ paymentMethod, onChange }: CheckoutPaymentMethodsProps) {
  const { t } = useTranslation();

  const methods = [
    { id: "upi", label: "UPI Payment", sub: "Google Pay, PhonePe, Paytm, BHIM", icon: "qr_code_scanner" },
    { id: "cod", label: "Cash on Delivery", sub: "Pay when you receive the order", icon: "payments" },
  ];

  return (
    <section className="bg-surface-container-lowest p-5 sm:p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
          <span className="material-symbols-outlined">payments</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">{t.checkout.paymentMethod}</h2>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {methods.map((pm) => (
          <label
            key={pm.id}
            className={`flex items-center justify-between p-4 sm:p-6 rounded-lg cursor-pointer transition-all ${
              paymentMethod === pm.id
                ? "bg-surface-container-low border-2 border-primary"
                : "hover:bg-surface-container-low border-2 border-transparent"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === pm.id}
                onChange={() => onChange(pm.id)}
                className="w-5 h-5 text-primary shrink-0"
              />
              <span className="material-symbols-outlined text-secondary shrink-0">{pm.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm sm:text-base truncate">{pm.label}</p>
                <p className="text-xs text-on-surface-variant truncate">{pm.sub}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}
