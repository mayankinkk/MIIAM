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
    <section className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">location_on</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-on-surface">{t.checkout.deliveryAddress}</h2>
          <p className="text-xs text-on-surface-variant">{t.checkout.whereToDeliver}</p>
        </div>
        <button
          onClick={onChangeAddress}
          className="text-primary font-bold text-sm bg-surface px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
        >
          Change
        </button>
      </div>

      {deliveryAddress ? (
        <div className="p-3 sm:p-4 rounded-xl border-2 border-primary bg-[#fff8f8] flex items-start gap-3 sm:gap-4">
          <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              {deliveryAddress.type === "office" ? "business" : deliveryAddress.type === "other" ? "place" : "home"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface flex items-center gap-2 flex-wrap">
              <span className="truncate">{deliveryAddress.label || "Home"}</span>
              {deliveryAddress.lat && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[10px]">gps_fixed</span>GPS
                </span>
              )}
            </p>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed break-words">
              {[deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(", ")}
            </p>
            {deliveryAddress.landmark && (
              <p className="text-xs text-[var(--color-outline-variant)] mt-1 break-words">📍 Near {deliveryAddress.landmark}</p>
            )}
          </div>
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>
      ) : (
        <button
          onClick={onChangeAddress}
          className="w-full p-4 sm:p-5 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface transition-all"
        >
          <span className="material-symbols-outlined text-3xl">add_location</span>
          <span className="font-bold text-sm sm:text-base">{t.checkout.addAddress}</span>
          <span className="text-xs">{t.checkout.gpsAutoDetect}</span>
        </button>
      )}

      {deliveryAddress && (
        <button
          onClick={onChangeAddress}
          className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t.checkout.useDifferentAddress}
        </button>
      )}
    </section>
  );
}
