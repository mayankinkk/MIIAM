"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";
import CheckoutDeliveryAddress from "@/components/checkout/CheckoutDeliveryAddress";
import CheckoutScheduledServices from "@/components/checkout/CheckoutScheduledServices";
import CheckoutScheduledDelivery from "@/components/checkout/CheckoutScheduledDelivery";
import CheckoutPaymentMethods from "@/components/checkout/CheckoutPaymentMethods";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import { SERVICES_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Skeleton } from "@/components/Skeleton";
import { calculateOrderTotals, isValidPhone, normalizePhone } from "@/lib/checkout-utils";
import { usePlaceOrder } from "@/lib/hooks/usePlaceOrder";
import logger from "@/lib/logger";

import { isVendorOpen } from "@/lib/vendor-hours";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [vendorHours, setVendorHours] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [placing, setPlacing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [showTipSelector, setShowTipSelector] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>("weekly");
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState<number>(new Date().getDay());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<SelectedAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SelectedAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [serviceCharge, setServiceCharge] = useState(15);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const { items, totalPrice } = useCartStore();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const saved = localStorage.getItem("miiam_selected_address");
    if (saved) {
      try {
        setDeliveryAddress(JSON.parse(saved));
      } catch {
        /* corrupted data, ignore */
      }
    }
    const allSaved = localStorage.getItem("miiam_addresses");
    if (allSaved) {
      try {
        setSavedAddresses(JSON.parse(allSaved));
      } catch {
        /* corrupted data, ignore */
      }
    }

    // Pre-fill the phone number from a previous order on this device.
    const lastPhone = localStorage.getItem("miiam_customer_phone");
    if (lastPhone) setPhone(lastPhone);

    async function loadVendorDetails() {
      try {
        const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
        if (vendorIds.length === 0) return;
        const { data } = await supabase
          .from("vendors")
          .select("id, opening_hours")
          .in("id", vendorIds);
        if (data) {
          const hours: Record<string, string> = {};
          for (const v of data as { id: string; opening_hours: string | null }[]) {
            if (v.opening_hours) hours[v.id] = v.opening_hours;
          }
          setVendorHours(hours);
        }
      } catch (err) {
        logger.error({ err: err }, "Failed to load vendor details");
      }
    }
    loadVendorDetails();

    async function loadServiceCharge() {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "service_charge")
          .maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch {
        /* use default */
      }
    }
    loadServiceCharge();
  }, [items, supabase]);

  const subtotal = totalPrice();
  const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
  const serviceVendorIds = vendorIds.filter((id) => id !== SERVICES_VENDOR_ID);

  const hasClosedVendor = serviceVendorIds.some(
    (id) => vendorHours[id] && !isVendorOpen(vendorHours[id]).open
  );

  const {
    discount: computedDiscount,
    totalDeliveryFee,
    totalServiceCharge,
    gstAmount,
    packagingFee,
    platformFee,
    grand,
  } = calculateOrderTotals({
    subtotal,
    tipAmount,
    serviceCharge,
    discount,
  });

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, vendorIds }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoCode(data.code);
        setDiscount(Number(data.discount) || 0);
        setPromoError(null);
      } else {
        setPromoCode("");
        setDiscount(0);
        setPromoError(data.error || t.checkout.invalidPromo);
      }
    } catch {
      setPromoCode("");
      setDiscount(0);
      setPromoError(t.checkout.validateFailed);
    }
    setApplyingPromo(false);
  };

  const removePromo = () => {
    setPromoInput("");
    setPromoCode("");
    setDiscount(0);
    setPromoError(null);
  };

  // Re-validate the applied promo when the subtotal changes so the discount never goes stale
  useEffect(() => {
    if (!promoCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode, subtotal, vendorIds }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) {
          setDiscount(Number(data.discount) || 0);
        } else {
          setPromoCode("");
          setDiscount(0);
          setPromoError(t.checkout.noLongerApplies);
        }
      } catch {
        /* keep last known discount; server re-validates at order time */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, promoCode]);

  const { placeOrder } = usePlaceOrder(supabase);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="bg-surface min-h-screen p-4" aria-label="Loading...">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!deliveryAddress) {
      setShowAddressWarning(true);
      setTimeout(() => setShowAddressWarning(false), 3000);
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(true);
      setTimeout(() => setPhoneError(false), 3000);
      return;
    }
    if (placing || items.length === 0 || hasClosedVendor) return;
    setPlacing(true);

    const phoneE164 = normalizePhone(phone);
    const orderArgs = {
      deliveryAddress,
      paymentMethod,
      discount: computedDiscount,
      subtotal,
      deliveryFee: totalDeliveryFee,
      promoCode,
      scheduledDate,
      scheduledTime,
      specialInstructions,
      tipAmount,
      isRecurring,
      recurringFrequency,
      recurringDayOfWeek,
      phone: phoneE164,
      serviceCharge,
    };

    placeOrder(orderArgs)
      .then((ok) => {
        if (ok) {
          try {
            window.localStorage.setItem("miiam_customer_phone", phoneE164);
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => setPlacing(false));
  };

  return (
    <div className="bg-surface min-h-screen pb-28 md:pb-32">
      {/* Sticky header — Blinkit style */}
      <header className="bg-surface-container-lowest/95 border-outline-variant/60 sticky top-0 z-30 border-b backdrop-blur-md">
        <div
          className="flex h-14 items-center gap-1 px-2"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <Link
            href="/app/cart"
            aria-label="Back to cart"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1 px-1">
            <p className="text-on-surface truncate text-[13px] font-bold">{t.checkout.title}</p>
            <p className="text-on-surface-variant truncate text-[11px]">{t.checkout.subtitle}</p>
          </div>
          <span
            className="text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl">
        {items.length === 0 ? (
          <section className="px-4 py-16 text-center">
            <span className="material-symbols-outlined text-outline-variant/60 text-6xl">
              shopping_cart
            </span>
            <h2 className="text-on-surface mt-4 text-base font-bold">{t.checkout.cartEmpty}</h2>
            <p className="text-on-surface-variant mt-1 text-sm">{t.checkout.cartEmptyDesc}</p>
            <Link
              href="/app/home"
              className="bg-primary text-on-primary shadow-primary/20 mt-5 inline-block rounded-xl px-6 py-3 text-sm font-black shadow-md transition-all active:scale-95"
            >
              {t.checkout.browseMenu}
            </Link>
          </section>
        ) : (
          <>
            {/* Delivery address */}
            <CheckoutDeliveryAddress
              deliveryAddress={deliveryAddress}
              onChangeAddress={() => setShowAddressPicker(true)}
            />

            {/* Contact phone */}
            <section className="border-outline-variant/60 border-b px-4 py-4">
              <label
                htmlFor="customer-phone"
                className="text-on-surface block text-[15px] font-bold"
              >
                {t.checkout.phoneLabel}{" "}
                <span className="text-status-error">{t.checkout.phoneRequired}</span>
              </label>
              <div className="relative mt-2.5">
                <span className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-3.5 -translate-y-1/2 text-[18px]">
                  call
                </span>
                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  required
                  className="bg-surface border-outline-variant/40 focus:border-primary focus:ring-primary/15 w-full rounded-xl border py-3 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
                  placeholder={t.checkout.phonePlaceholder}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError(false);
                  }}
                  aria-describedby="customer-phone-help"
                  aria-invalid={phoneError}
                />
              </div>
              <p
                id="customer-phone-help"
                className={`mt-1.5 text-xs font-semibold ${phoneError ? "text-status-error" : "text-on-surface-variant"}`}
                role={phoneError ? "alert" : undefined}
              >
                {phoneError ? t.checkout.phoneInvalid : t.checkout.phoneHelp}
              </p>
            </section>

            {/* Schedule */}
            {items.some((i) => i.vendor_id === SERVICES_VENDOR_ID) ? (
              <CheckoutScheduledServices items={items} />
            ) : (
              <CheckoutScheduledDelivery
                scheduledDate={scheduledDate}
                onScheduledDateChange={setScheduledDate}
                scheduledTime={scheduledTime}
                onScheduledTimeChange={setScheduledTime}
                showDatePicker={showDatePicker}
                onShowDatePickerChange={setShowDatePicker}
                showTimePicker={showTimePicker}
                onShowTimePickerChange={setShowTimePicker}
                isRecurring={isRecurring}
                onIsRecurringChange={setIsRecurring}
                recurringFrequency={recurringFrequency}
                onRecurringFrequencyChange={setRecurringFrequency}
                recurringDayOfWeek={recurringDayOfWeek}
                onRecurringDayOfWeekChange={setRecurringDayOfWeek}
                vendorIds={vendorIds}
                onClearSchedule={() => {
                  setScheduledDate("");
                  setScheduledTime("");
                  setIsRecurring(false);
                }}
              />
            )}

            {/* Payment method */}
            <CheckoutPaymentMethods paymentMethod={paymentMethod} onChange={setPaymentMethod} />

            {/* Closed vendor warning */}
            {hasClosedVendor && (
              <section className="bg-status-error/10 border-outline-variant/60 flex items-start gap-2 border-b px-4 py-3">
                <span className="material-symbols-outlined text-status-error mt-0.5 text-[18px]">
                  schedule
                </span>
                <p className="text-status-error text-sm font-medium">
                  {t.checkout.closedVendorWarning}
                </p>
              </section>
            )}

            {/* Promo code */}
            <section className="border-outline-variant/60 border-b px-4 py-4">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  local_offer
                </span>
                <h2 className="text-on-surface text-[15px] font-bold">{t.checkout.promoCode}</h2>
              </div>
              {promoCode ? (
                <div className="bg-status-success/10 border-status-success/30 flex items-center justify-between gap-2 rounded-xl border px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="material-symbols-outlined text-accent text-lg">verified</span>
                    <span className="text-accent truncate text-sm font-bold">{promoCode}</span>
                    <span className="text-accent text-xs font-semibold">
                      -₹{computedDiscount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={removePromo}
                    className="text-on-surface-variant hover:text-on-surface shrink-0 text-xs font-semibold"
                    aria-label={t.checkout.removePromo}
                  >
                    {t.cart.remove}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="promo-code"
                    type="text"
                    className="bg-surface border-outline-variant/40 focus:border-primary focus:ring-primary/15 min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm uppercase focus:ring-2 focus:outline-none"
                    placeholder={t.checkout.enterCode}
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError(null);
                    }}
                    autoComplete="off"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    className="bg-primary text-on-primary hover:bg-primary-dim shrink-0 rounded-xl px-5 py-3 text-sm font-black transition-all active:scale-95 disabled:opacity-50"
                  >
                    {applyingPromo ? "..." : t.checkout.apply}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-status-error mt-1.5 text-xs font-semibold" role="alert">
                  {promoError}
                </p>
              )}
            </section>

            {/* Special instructions */}
            <section className="border-outline-variant/60 border-b px-4 py-4">
              <label
                htmlFor="special-instructions"
                className="text-on-surface block text-[15px] font-bold"
              >
                {t.checkout.specialInstructions}{" "}
                <span className="text-on-surface-variant text-xs font-medium">
                  {t.checkout.optional}
                </span>
              </label>
              <textarea
                id="special-instructions"
                className="bg-surface border-outline-variant/40 focus:border-primary focus:ring-primary/15 mt-2.5 w-full resize-none rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                rows={2}
                placeholder={t.checkout.specialInstructionsPlaceholder}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </section>

            {/* Bill details */}
            <CheckoutOrderSummary
              items={items}
              subtotal={subtotal}
              discount={computedDiscount}
              totalDeliveryFee={totalDeliveryFee}
              totalServiceCharge={totalServiceCharge}
              gstAmount={gstAmount}
              packagingFee={packagingFee}
              platformFee={platformFee}
              grand={grand}
              showTipSelector={showTipSelector}
              tipAmount={tipAmount}
              onTipSelect={(amount) => {
                setTipAmount(amount);
                setShowTipSelector(false);
              }}
              onSkipTip={() => {
                setTipAmount(0);
                setShowTipSelector(false);
              }}
              onEditTip={() => setShowTipSelector(true)}
            />
          </>
        )}
      </div>

      {/* Sticky bottom bar — price + Place Order (Blinkit style). Bottom nav is hidden on checkout, so the bar sits at the viewport edge. */}
      {items.length > 0 && (
        <div className="bg-surface-container-lowest border-outline-variant/60 fixed right-0 bottom-0 left-0 z-40 border-t shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:right-6 md:bottom-6 md:left-auto md:max-w-md md:rounded-2xl md:border md:shadow-xl">
          {(showAddressWarning || phoneError) && (
            <p
              className="text-status-error px-4 pt-2 text-center text-xs font-semibold"
              role="alert"
            >
              {!deliveryAddress ? t.checkout.selectAddressFirst : t.checkout.phoneInvalid}
            </p>
          )}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
          >
            <div className="min-w-0">
              <p className="text-on-surface-variant truncate text-[10px] font-bold tracking-wider uppercase">
                {t.checkout.totalAmount}
              </p>
              <p className="text-on-surface truncate text-lg font-black">₹{grand.toFixed(2)}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || items.length === 0 || !deliveryAddress || hasClosedVendor}
              className="bg-primary text-on-primary hover:bg-primary-dim shadow-primary/20 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-black shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {placing ? (
                <>
                  <span className="border-on-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  {t.checkout.placingOrder}
                </>
              ) : (
                t.checkout.placeOrder
              )}
            </button>
          </div>
        </div>
      )}

      {showAddressPicker && (
        <AddressPickerSheet
          savedAddresses={savedAddresses}
          onSelect={(addr) => {
            setDeliveryAddress(addr);
            localStorage.setItem("miiam_selected_address", JSON.stringify(addr));
            const existing = savedAddresses.find(
              (a) =>
                a.street === addr.street &&
                a.city === addr.city &&
                a.postal_code === addr.postal_code
            );
            if (!existing) {
              const updated = [...savedAddresses, addr];
              setSavedAddresses(updated);
              localStorage.setItem("miiam_addresses", JSON.stringify(updated));
            }
            setShowAddressPicker(false);
          }}
          onClose={() => setShowAddressPicker(false)}
        />
      )}
    </div>
  );
}
