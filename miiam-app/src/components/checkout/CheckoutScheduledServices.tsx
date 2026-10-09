"use client";

import { SERVICES_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CartItem } from "@/lib/store/cartStore";

interface CheckoutScheduledServicesProps {
  items: CartItem[];
}

export default function CheckoutScheduledServices({ items }: CheckoutScheduledServicesProps) {
  const { t } = useTranslation();
  const serviceItems = items.filter(i => i.vendor_id === SERVICES_VENDOR_ID);
  if (serviceItems.length === 0) return null;

  return (
    <section className="px-4 py-4 border-b border-outline-variant/60">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="material-symbols-outlined text-accent text-[20px]">event_available</span>
        <h2 className="text-[15px] font-bold text-on-surface">{t.checkout.scheduledServices}</h2>
      </div>
      <div className="divide-y divide-outline-variant/40">
        {serviceItems.map(item => (
          <div key={item.id} className="py-3 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-on-surface truncate">{item.name.split(' (')[0]}</h3>
              <p className="text-xs text-accent flex items-center gap-1 font-semibold mt-0.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {item.name.includes('(') ? item.name.substring(item.name.indexOf('(') + 1, item.name.lastIndexOf(')')) : t.checkout.scheduled}
              </p>
            </div>
            <div className="font-bold text-sm text-on-surface shrink-0">₹{item.price} x {item.quantity}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
