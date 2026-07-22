"use client";

import { SERVICES_VENDOR_ID } from "@/lib/constants";
import type { CartItem } from "@/lib/store/cartStore";

interface CheckoutScheduledServicesProps {
  items: CartItem[];
}

export default function CheckoutScheduledServices({ items }: CheckoutScheduledServicesProps) {
  const serviceItems = items.filter(i => i.vendor_id === SERVICES_VENDOR_ID);
  if (serviceItems.length === 0) return null;

  return (
    <section className="bg-surface-container-lowest p-5 sm:p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-status-success/10 flex items-center justify-center text-status-success shrink-0">
          <span className="material-symbols-outlined">event_available</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Scheduled Services</h2>
      </div>
      <div className="space-y-4">
        {serviceItems.map(item => (
          <div key={item.id} className="p-4 rounded-lg border border-outline-variant/20 bg-[var(--color-surface-subtle)] flex justify-between items-center">
            <div>
              <h3 className="font-bold">{item.name.split(' (')[0]}</h3>
              <p className="text-sm text-secondary flex items-center gap-1 font-semibold mt-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {item.name.includes('(') ? item.name.substring(item.name.indexOf('(') + 1, item.name.lastIndexOf(')')) : "Scheduled"}
              </p>
            </div>
            <div className="font-bold text-primary">₹{item.price} x {item.quantity}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
