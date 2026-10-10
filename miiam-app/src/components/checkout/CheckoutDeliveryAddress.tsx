"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { SelectedAddress } from "@/components/AddressPickerSheet";

interface CheckoutDeliveryAddressProps {
  deliveryAddress: SelectedAddress | null;
  onChangeAddress: () => void;
}

export default function CheckoutDeliveryAddress({
  deliveryAddress,
  onChangeAddress,
}: CheckoutDeliveryAddressProps) {
  const { t } = useTranslation();

  return (
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-accent shrink-0 text-[20px]">
            location_on
          </span>
          <div className="min-w-0">
            <h2 className="text-on-surface truncate text-[15px] font-bold">
              {t.checkout.deliveryAddress}
            </h2>
            <p className="text-on-surface-variant truncate text-xs">{t.checkout.whereToDeliver}</p>
          </div>
        </div>
        <button
          onClick={onChangeAddress}
          className="text-accent shrink-0 text-[13px] font-bold hover:underline"
        >
          {t.checkout.change}
        </button>
      </div>

      {deliveryAddress ? (
        <div className="border-primary bg-primary/5 flex items-start gap-3 rounded-xl border-2 p-3">
          <span
            className="material-symbols-outlined text-accent mt-0.5 shrink-0 text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {deliveryAddress.type === "office"
              ? "business"
              : deliveryAddress.type === "other"
                ? "place"
                : "home"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-on-surface flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="truncate">{deliveryAddress.label || t.checkout.homeLabel}</span>
              {deliveryAddress.lat && (
                <span className="bg-status-success/10 text-accent flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  <span className="material-symbols-outlined text-[10px]">gps_fixed</span>GPS
                </span>
              )}
            </p>
            <p className="text-on-surface-variant mt-0.5 text-[13px] leading-relaxed break-words">
              {[
                deliveryAddress.flat,
                deliveryAddress.street,
                deliveryAddress.city,
                deliveryAddress.state,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {deliveryAddress.landmark && (
              <p className="text-on-surface-variant mt-0.5 text-xs break-words">
                {t.checkout.nearLandmark.replace("{landmark}", deliveryAddress.landmark)}
              </p>
            )}
          </div>
          <div className="bg-primary mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
            <span
              className="material-symbols-outlined text-on-primary text-xs"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={onChangeAddress}
          className="border-outline-variant/50 text-on-surface-variant hover:border-primary hover:bg-primary/5 flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed py-4 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add_location</span>
          <span className="text-sm font-bold">{t.checkout.addAddress}</span>
          <span className="text-xs">{t.checkout.gpsAutoDetect}</span>
        </button>
      )}

      {deliveryAddress && (
        <button
          onClick={onChangeAddress}
          className="border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-accent mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-xs font-bold transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t.checkout.useDifferentAddress}
        </button>
      )}
    </section>
  );
}
