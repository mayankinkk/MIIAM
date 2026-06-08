"use client";

import { PRINTING_VENDOR_ID } from "@/lib/constants";
import type { CartItem } from "@/lib/store/cartStore";

interface CheckoutPrintOrderSummaryProps {
  items: CartItem[];
}

export default function CheckoutPrintOrderSummary({ items }: CheckoutPrintOrderSummaryProps) {
  const printItems = items.filter(i => i.vendor_id === PRINTING_VENDOR_ID);
  if (printItems.length === 0) return null;

  return (
    <section className="bg-surface-container-lowest p-5 sm:p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
          <span className="material-symbols-outlined">print</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Print Order</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">We&apos;ll print & deliver in minutes</p>
        </div>
      </div>
      <div className="space-y-3">
        {printItems.map(item => {
          let settings: Record<string, any> = {};
          try { if (item.special_notes) settings = JSON.parse(item.special_notes); } catch {}
          return (
            <div key={item.id} className="p-3 sm:p-4 rounded-lg border border-outline-variant/20 bg-indigo-50/30">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold min-w-0 break-words">{item.name}</h3>
                <div className="font-bold text-indigo-700 shrink-0">₹{item.price} x {item.quantity}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {settings.pages && <span className="px-2 py-1 bg-white rounded-lg font-semibold">{settings.pages} pg</span>}
                {settings.copies && <span className="px-2 py-1 bg-white rounded-lg font-semibold">{settings.copies} cp</span>}
                {settings.colorMode && <span className="px-2 py-1 bg-white rounded-lg font-semibold capitalize">{settings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                {settings.paperSize && <span className="px-2 py-1 bg-white rounded-lg font-semibold uppercase">{settings.paperSize}</span>}
                {settings.orientation && <span className="px-2 py-1 bg-white rounded-lg font-semibold capitalize">{settings.orientation}</span>}
                {settings.paperType && <span className="px-2 py-1 bg-white rounded-lg font-semibold capitalize">{settings.paperType}</span>}
                {settings.sides && <span className="px-2 py-1 bg-white rounded-lg font-semibold capitalize">{settings.sides} sided</span>}
              </div>
              {settings.fileNames && (
                <div className="mt-2 text-xs text-on-surface-variant break-words">
                  Files: {settings.fileNames.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
