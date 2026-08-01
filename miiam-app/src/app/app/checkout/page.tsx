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
import Breadcrumbs from "@/components/Breadcrumbs";
import { SERVICES_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Skeleton } from "@/components/Skeleton";
import { calculateOrderTotals } from "@/lib/checkout-utils";
import { usePlaceOrder } from "@/lib/hooks/usePlaceOrder";
import logger from "@/lib/logger";

function parseIsOpen(hours: string | null | undefined): boolean {
  if (!hours) return true;
  try {
    const to24 = (t: string) => {
      const [time, mod] = t.trim().split(" ");
      let [h, m] = time.split(":").map(Number);
      if (!m) m = 0;
      if (mod?.toUpperCase() === "PM" && h !== 12) h += 12;
      if (mod?.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const parts = hours.replace("–", "-").split("-");
    if (parts.length < 2) return true;
    const open = to24(parts[0]);
    const close = to24(parts[1]);
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= open && cur < close;
  } catch { return true; }
}

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
  const [hydrated, setHydrated] = useState(false);
  const [showAddressWarning, setShowAddressWarning] = useState(false);
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

    async function loadServiceCharge() {
      try {
        const { data } = await supabase.from("site_settings").select("value").eq("key", "service_charge").maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch { /* use default */ }
    }
    loadServiceCharge();

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
  }, [items, supabase]);

  const subtotal = totalPrice();
  const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
  const serviceVendorIds = vendorIds.filter((id) => id !== SERVICES_VENDOR_ID);

  const hasClosedVendor = useMemo(() => {
    return serviceVendorIds.some((id) => vendorHours[id] && !parseIsOpen(vendorHours[id]));
  }, [serviceVendorIds, vendorHours]);

  const { discount, totalDeliveryFee, totalServiceCharge, gstAmount, packagingFee, platformFee, grand } = calculateOrderTotals({
    subtotal,
    tipAmount,
    serviceCharge,
  });

  const { placeOrder } = usePlaceOrder(supabase);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] p-4" aria-label="Loading...">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            <div className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-surface-container-low dark:bg-[var(--color-surface-container)] p-5 sm:p-8 rounded-2xl shadow-sm space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-surface/80 dark:bg-[var(--color-surface)]/80 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/app/cart" aria-label="Back to cart" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container dark:hover:bg-[var(--color-surface-container)] transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface dark:text-[var(--color-on-surface)] font-semibold hidden md:block">Checkout</span>
      </nav>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Cart", href: "/app/cart" }, { label: "Checkout" }]} />

      <main className="pt-20 sm:pt-24 pb-24 px-3 sm:px-6 max-w-7xl mx-auto bg-background dark:bg-[var(--color-surface)] text-on-background dark:text-[var(--color-on-surface)]">
        <header className="mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface dark:text-[var(--color-on-surface)] mb-2 break-words">{t.checkout.title}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant dark:text-[var(--color-outline)]">{t.checkout.subtitle}</p>
        </header>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">shopping_cart</span>
            <h2 className="text-xl font-black text-[var(--color-on-surface-variant)] mt-4">{t.checkout.cartEmpty}</h2>
            <p className="text-sm text-[var(--color-outline-variant)] mt-2">{t.checkout.cartEmptyDesc}</p>
            <Link href="/app/home" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">{t.checkout.browseMenu}</Link>
          </div>
        ) : (

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            <CheckoutDeliveryAddress
              deliveryAddress={deliveryAddress}
              onChangeAddress={() => setShowAddressPicker(true)}
            />
            <CheckoutScheduledServices items={items} />
            {!items.some(i => i.vendor_id === SERVICES_VENDOR_ID) && (
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
            <CheckoutPaymentMethods
              paymentMethod={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <aside className="bg-surface-container-low dark:bg-[var(--color-surface-container)] p-5 sm:p-8 rounded-2xl shadow-sm relative">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                discount={discount}
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

              {/* Special Instructions */}
              <div className="mb-3">
                <label className="text-xs font-bold text-on-surface-variant mb-1.5 block">Special Instructions (optional)</label>
                <textarea
                  className="w-full px-4 py-3 bg-surface-subtle rounded-xl border border-outline/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm resize-none"
                  rows={2}
                  placeholder="E.g. Ring bell, leave at door, no onions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  aria-label="Special instructions"
                />
              </div>

              {hasClosedVendor && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">schedule</span>
                  <p className="text-red-700 text-sm font-medium">One or more restaurants in your cart are currently closed. Please remove their items or try again later.</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!deliveryAddress) {
                    setShowAddressWarning(true);
                    setTimeout(() => setShowAddressWarning(false), 3000);
                    return;
                  }
                  setPlacing(true);

                  const orderArgs = {
                    deliveryAddress,
                    paymentMethod,
                    discount,
                    subtotal,
                    deliveryFee: totalDeliveryFee,
                    promoCode: "",
                    scheduledDate,
                    scheduledTime,
                    specialInstructions,
                    tipAmount,
                    isRecurring,
                    recurringFrequency,
                    recurringDayOfWeek,
                    phone: deliveryAddress.phone || "",
                  };

                  placeOrder(orderArgs).finally(() => setPlacing(false));
                }}
                disabled={placing || items.length === 0 || !deliveryAddress || hasClosedVendor}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 sm:py-5 rounded-xl text-base sm:text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.checkout.placingOrder}
                  </>
                ) : t.checkout.placeOrder}
                {!placing && <span className="material-symbols-outlined">shield</span>}
              </button>

              {showAddressWarning && (
                <p className="text-center mt-3 text-xs text-red-500 font-semibold animate-pulse">Please select a delivery address first</p>
              )}

              <p className="text-center mt-6 text-xs text-on-surface-variant dark:text-[var(--color-outline)] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                {t.checkout.securePayment}
              </p>
            </aside>
          </div>
        </div>
        )}

      </main>

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
    </>
  );
}
