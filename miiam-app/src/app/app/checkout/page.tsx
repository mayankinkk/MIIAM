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
      try { setDeliveryAddress(JSON.parse(saved)); } catch { /* corrupted data, ignore */ }
    }
    const allSaved = localStorage.getItem("miiam_addresses");
    if (allSaved) {
      try { setSavedAddresses(JSON.parse(allSaved)); } catch { /* corrupted data, ignore */ }
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
        const { data } = await supabase.from("site_settings").select("value").eq("key", "service_charge").maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch { /* use default */ }
    }
    loadServiceCharge();
  }, [items, supabase]);

  const subtotal = totalPrice();
  const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
  const serviceVendorIds = vendorIds.filter((id) => id !== SERVICES_VENDOR_ID);

  const hasClosedVendor = serviceVendorIds.some((id) => vendorHours[id] && !isVendorOpen(vendorHours[id]).open);

  const { discount: computedDiscount, totalDeliveryFee, totalServiceCharge, gstAmount, packagingFee, platformFee, grand } = calculateOrderTotals({
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
        setPromoError(data.error || "Invalid promo code");
      }
    } catch {
      setPromoCode("");
      setDiscount(0);
      setPromoError("Could not validate promo code. Please try again.");
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
          setPromoError(data.error || "Promo code no longer applies");
        }
      } catch {
        /* keep last known discount; server re-validates at order time */
      }
    })();
    return () => { cancelled = true; };
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
      <div className="min-h-screen bg-surface p-4" aria-label="Loading...">
        <div className="max-w-2xl mx-auto space-y-4">
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
          try { window.localStorage.setItem("miiam_customer_phone", phoneE164); } catch { /* ignore */ }
        }
      })
      .finally(() => setPlacing(false));
  };

  return (
    <div className="min-h-screen bg-surface pb-28 md:pb-32">
      {/* Sticky header — Blinkit style */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60">
        <div className="h-14 flex items-center gap-1 px-2" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <Link
            href="/app/cart"
            aria-label="Back to cart"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[13px] font-bold text-on-surface truncate">{t.checkout.title}</p>
            <p className="text-[11px] text-on-surface-variant truncate">{t.checkout.subtitle}</p>
          </div>
          <span className="w-10 h-10 shrink-0 flex items-center justify-center text-on-surface-variant" aria-hidden="true">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {items.length === 0 ? (
          <section className="px-4 py-16 text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant/60">shopping_cart</span>
            <h2 className="text-base font-bold text-on-surface mt-4">{t.checkout.cartEmpty}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{t.checkout.cartEmptyDesc}</p>
            <Link
              href="/app/home"
              className="inline-block mt-5 px-6 py-3 bg-primary text-on-primary rounded-xl font-black text-sm shadow-md shadow-primary/20 active:scale-95 transition-all"
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
            <section className="px-4 py-4 border-b border-outline-variant/60">
              <label htmlFor="customer-phone" className="text-[15px] font-bold text-on-surface block">
                Phone number <span className="text-status-error">*</span>
              </label>
              <div className="relative mt-2.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">call</span>
                <input
                  id="customer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(false); }}
                  aria-describedby="customer-phone-help"
                  aria-invalid={phoneError}
                />
              </div>
              <p
                id="customer-phone-help"
                className={`mt-1.5 text-xs font-semibold ${phoneError ? "text-status-error" : "text-on-surface-variant"}`}
                role={phoneError ? "alert" : undefined}
              >
                {phoneError ? "Enter a valid 10-digit mobile number" : "We'll only use this to update you about the order."}
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
                onClearSchedule={() => { setScheduledDate(""); setScheduledTime(""); setIsRecurring(false); }}
              />
            )}

            {/* Payment method */}
            <CheckoutPaymentMethods
              paymentMethod={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* Closed vendor warning */}
            {hasClosedVendor && (
              <section className="px-4 py-3 bg-status-error/10 border-b border-outline-variant/60 flex items-start gap-2">
                <span className="material-symbols-outlined text-status-error text-[18px] mt-0.5">schedule</span>
                <p className="text-sm font-medium text-status-error">One or more restaurants in your cart are currently closed. Please remove their items or try again later.</p>
              </section>
            )}

            {/* Promo code */}
            <section className="px-4 py-4 border-b border-outline-variant/60">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="material-symbols-outlined text-accent text-[20px]">local_offer</span>
                <h2 className="text-[15px] font-bold text-on-surface">{t.checkout.promoCode}</h2>
              </div>
              {promoCode ? (
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-status-success/10 border border-status-success/30 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-accent text-lg">verified</span>
                    <span className="text-sm font-bold text-accent truncate">{promoCode}</span>
                    <span className="text-xs font-semibold text-accent">-₹{computedDiscount.toFixed(2)}</span>
                  </div>
                  <button onClick={removePromo} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface shrink-0" aria-label="Remove promo code">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="promo-code"
                    type="text"
                    className="flex-1 min-w-0 px-4 py-3 bg-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm uppercase"
                    placeholder="Enter code"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                    autoComplete="off"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    className="px-5 py-3 bg-primary text-on-primary rounded-xl text-sm font-black hover:bg-primary-dim active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    {applyingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="mt-1.5 text-xs text-status-error font-semibold" role="alert">{promoError}</p>
              )}
            </section>

            {/* Special instructions */}
            <section className="px-4 py-4 border-b border-outline-variant/60">
              <label htmlFor="special-instructions" className="text-[15px] font-bold text-on-surface block">
                Special Instructions <span className="text-xs font-medium text-on-surface-variant">(optional)</span>
              </label>
              <textarea
                id="special-instructions"
                className="w-full mt-2.5 px-4 py-3 bg-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm resize-none"
                rows={2}
                placeholder="E.g. Ring bell, leave at door, no onions..."
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
              onTipSelect={(amount) => { setTipAmount(amount); setShowTipSelector(false); }}
              onSkipTip={() => { setTipAmount(0); setShowTipSelector(false); }}
              onEditTip={() => setShowTipSelector(true)}
            />
          </>
        )}
      </div>

      {/* Sticky bottom bar — price + Place Order (Blinkit style). Bottom nav is hidden on checkout, so the bar sits at the viewport edge. */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:bottom-6 md:right-6 md:max-w-md z-40 bg-surface-container-lowest border-t md:border md:rounded-2xl border-outline-variant/60 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:shadow-xl">
          {(showAddressWarning || phoneError) && (
            <p className="px-4 pt-2 text-xs font-semibold text-status-error text-center" role="alert">
              {!deliveryAddress ? "Please select a delivery address first" : "Enter a valid 10-digit mobile number"}
            </p>
          )}
          <div className="flex items-center gap-3 px-4 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">{t.checkout.totalAmount}</p>
              <p className="text-lg font-black text-on-surface truncate">₹{grand.toFixed(2)}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || items.length === 0 || !deliveryAddress || hasClosedVendor}
              className="flex-1 min-w-0 bg-primary text-on-primary py-3 rounded-xl font-black text-sm hover:bg-primary-dim active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-primary/20"
            >
              {placing ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
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
            const existing = savedAddresses.find(a => a.street === addr.street && a.city === addr.city && a.postal_code === addr.postal_code);
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
