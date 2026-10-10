"use client";

import { SERVICES_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CartItem } from "@/lib/store/cartStore";

interface CheckoutScheduledServicesProps {
  items: CartItem[];
}

export default function CheckoutScheduledServices({ items }: CheckoutScheduledServicesProps) {
  const { t } = useTranslation();
  const serviceItems = items.filter((i) => i.vendor_id === SERVICES_VENDOR_ID);
  if (serviceItems.length === 0) return null;

  return (
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="material-symbols-outlined text-accent text-[20px]">event_available</span>
        <h2 className="text-on-surface text-[15px] font-bold">{t.checkout.scheduledServices}</h2>
      </div>
      <div className="divide-outline-variant/40 divide-y">
        {serviceItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <h3 className="text-on-surface truncate text-sm font-bold">
                {item.name.split(" (")[0]}
              </h3>
              <p className="text-accent mt-0.5 flex items-center gap-1 text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {item.name.includes("(")
                  ? item.name.substring(item.name.indexOf("(") + 1, item.name.lastIndexOf(")"))
                  : t.checkout.scheduled}
              </p>
            </div>
            <div className="text-on-surface shrink-0 text-sm font-bold">
              ₹{item.price} x {item.quantity}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
