"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { SelectedAddress } from "@/components/AddressPickerSheet";

interface CheckoutDeliveryAddressProps {
  deliveryAddress: SelectedAddress | null;
  onChangeAddress: () => void;
}

export default function CheckoutDeliveryAddress({ deliveryAddress, onChangeAddress }: CheckoutDeliveryAddressProps) {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-4 border-b border-outline-variant/60">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-accent text-[20px] shrink-0">location_on</span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-on-surface truncate">{t.checkout.deliveryAddress}</h2>
            <p className="text-xs text-on-surface-variant truncate">{t.checkout.whereToDeliver}</p>
          </div>
        </div>
        <button
          onClick={onChangeAddress}
          className="shrink-0 text-[13px] font-bold text-accent hover:underline"
        >
          Change
        </button>
      </div>

      {deliveryAddress ? (
        <div className="p-3 rounded-xl border-2 border-primary bg-primary/5 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-accent text-[22px] mt-0.5 shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {deliveryAddress.type === "office" ? "business" : deliveryAddress.type === "other" ? "place" : "home"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface text-sm flex items-center gap-2 flex-wrap">
              <span className="truncate">{deliveryAddress.label || "Home"}</span>
              {deliveryAddress.lat && (
                <span className="text-[10px] bg-status-success/10 text-accent px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[10px]">gps_fixed</span>GPS
                </span>
              )}
            </p>
            <p className="text-[13px] text-on-surface-variant mt-0.5 leading-relaxed break-words">
              {[deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(", ")}
            </p>
            {deliveryAddress.landmark && (
              <p className="text-xs text-on-surface-variant mt-0.5 break-words">Near {deliveryAddress.landmark}</p>
            )}
          </div>
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-on-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>
      ) : (
        <button
          onClick={onChangeAddress}
          className="w-full py-4 rounded-xl border border-dashed border-outline-variant/50 flex flex-col items-center gap-1.5 text-on-surface-variant hover:border-primary hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add_location</span>
          <span className="font-bold text-sm">{t.checkout.addAddress}</span>
          <span className="text-xs">{t.checkout.gpsAutoDetect}</span>
        </button>
      )}

      {deliveryAddress && (
        <button
          onClick={onChangeAddress}
          className="mt-2.5 w-full py-2.5 rounded-xl border border-dashed border-outline-variant/40 text-xs font-bold text-on-surface-variant hover:border-primary hover:text-accent flex items-center justify-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t.checkout.useDifferentAddress}
        </button>
      )}
    </section>
  );
}
