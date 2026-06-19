"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useCartStore } from "@/lib/store/cartStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";
import CheckoutDeliveryAddress from "@/components/checkout/CheckoutDeliveryAddress";
import CheckoutScheduledServices from "@/components/checkout/CheckoutScheduledServices";
import CheckoutPrintOrderSummary from "@/components/checkout/CheckoutPrintOrderSummary";
import CheckoutScheduledDelivery from "@/components/checkout/CheckoutScheduledDelivery";
import CheckoutPaymentMethods from "@/components/checkout/CheckoutPaymentMethods";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutPromoCode from "@/components/checkout/CheckoutPromoCode";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SERVICES_VENDOR_ID, PRINTING_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { calculateOrderTotals } from "@/lib/checkout-utils";
import type { PromoCode } from "@/lib/checkout-utils";
import { useCheckoutPromo } from "@/lib/hooks/useCheckoutPromo";
import { usePlaceOrder } from "@/lib/hooks/usePlaceOrder";
import { useRazorpay } from "@/lib/hooks/useRazorpay";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [vendorDeliveryCharges, setVendorDeliveryCharges] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("upi");
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
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(8);
  const [promoCodesRaw, setPromoCodesRaw] = useState<PromoCode[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { items, totalPrice } = useCartStore();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const hasPrint = items.some(i => i.vendor_id === PRINTING_VENDOR_ID);
    const hasFood = items.some(i => i.vendor_id !== PRINTING_VENDOR_ID && i.vendor_id !== SERVICES_VENDOR_ID);
    if (hasPrint && !hasFood) setPaymentMethod("cod");

    const saved = localStorage.getItem("miiam_selected_address");
    if (saved) {
      try { setDeliveryAddress(JSON.parse(saved)); } catch { /* corrupted data, ignore */ }
    }
    const allSaved = localStorage.getItem("miiam_addresses");
    if (allSaved) {
      try { setSavedAddresses(JSON.parse(allSaved)); } catch { /* corrupted data, ignore */ }
    }

    async function loadPromoCodes() {
      try {
        const { data } = await supabase
          .from("promo_codes")
          .select("code, discount_value, min_order_amount, discount_type, is_active, vendor_id, max_discount, usage_limit, used_count, valid_until")
          .eq("is_active", true);
        if (data) setPromoCodesRaw(data);
      } catch (err) {
        console.error("Failed to load promo codes:", err);
      }
    }
    loadPromoCodes();

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
          .select("id, delivery_charge")
          .in("id", vendorIds);
        if (data) {
          const charges = data.reduce((acc: Record<string, number>, v: { id: string; delivery_charge: number | null }) => {
            acc[v.id] = v.delivery_charge || 0;
            return acc;
          }, {} as Record<string, number>);
          setVendorDeliveryCharges(charges);
        }
      } catch (err) {
        console.error("Failed to load vendor delivery charges:", err);
      }
    }
    loadVendorDetails();
  }, [items, supabase]);

  const subtotal = totalPrice();
  const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
  const serviceVendorIds = vendorIds.filter((id) => id !== PRINTING_VENDOR_ID && id !== SERVICES_VENDOR_ID);

  const {
    promoCode,
    setPromoCode,
    promoApplied,
    promoError,
    clearPromoError,
    handleApplyPromo,
    removePromo,
  } = useCheckoutPromo({ promoCodes: promoCodesRaw, subtotal, items });

  const { discount, totalDeliveryFee, grand } = calculateOrderTotals({
    subtotal,
    promoApplied,
    serviceVendorIds,
    tipAmount,
    serviceCharge,
    vendorDeliveryCharges,
  });

  const { placeOrder } = usePlaceOrder(supabase);
  const { pay, loading: razorpayLoading } = useRazorpay();

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  async function handleSendOtp() {
    const clean = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setOtpError("Enter a valid 10-digit phone number");
      return;
    }
    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, purpose: "checkout" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    const clean = phone.replace(/\D/g, "");
    if (!otpCode.trim()) {
      setOtpError("Enter the OTP sent to your phone");
      return;
    }
    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, otpCode: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      setPhoneVerified(true);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (phoneVerified) {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpCode("");
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[var(--color-surface)]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" role="status" aria-live="polite" />
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

      <Breadcrumbs items={[{ label: "Home", href: "/app/explore" }, { label: "Cart", href: "/app/cart" }, { label: "Checkout" }]} />

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
            <section className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] p-4 sm:p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-[var(--color-surface-container)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{phoneVerified ? "verified" : "phone"}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-on-surface dark:text-[var(--color-on-surface)]">{t.services.phoneNumber || "Phone Number"}</h2>
                  <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)]">
                    {phoneVerified ? "Phone verified" : (t.services.phonePlaceholder || "For rider to contact you")}
                  </p>
                </div>
                {phoneVerified && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Verified</span>
                )}
              </div>
              {!phoneVerified ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      className="flex-1 border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                      placeholder={t.services.phonePlaceholder || "Enter your phone number"}
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      aria-label={t.services.phoneNumber || "Phone Number"}
                      inputMode="numeric"
                      maxLength={10}
                      disabled={otpSent}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpCooldown > 0 || phone.replace(/\D/g, "").length !== 10}
                      className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {sendingOtp ? "Sending..." : otpCooldown > 0 ? `Retry ${otpCooldown}s` : "Send OTP"}
                    </button>
                  </div>
                  {otpSent && (
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        className="flex-1 border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
                        placeholder="Enter 6-digit OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        aria-label="OTP verification code"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="px-4 py-3 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {verifyingOtp ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  )}
                  {otpError && (
                    <p className="text-xs text-red-500 font-medium">{otpError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface dark:text-[var(--color-on-surface)] font-medium">{phone}</span>
                  <button
                    type="button"
                    onClick={() => { setPhoneVerified(false); setOtpSent(false); setOtpCode(""); setPhone(""); }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </section>
            <CheckoutScheduledServices items={items} />
            <CheckoutPrintOrderSummary items={items} />
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
            <aside className="bg-surface-container-low dark:bg-[var(--color-surface-container)] p-5 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                discount={discount}
                totalDeliveryFee={totalDeliveryFee}
                vendorIds={vendorIds}
                serviceCharge={serviceCharge}
                grand={grand}
                showTipSelector={showTipSelector}
                tipAmount={tipAmount}
                onTipSelect={(amount) => { setTipAmount(amount); setShowTipSelector(false); }}
                onSkipTip={() => { setTipAmount(0); setShowTipSelector(false); }}
                onEditTip={() => setShowTipSelector(true)}
              />

              <div className="mb-6 sm:mb-8">
                <CheckoutPromoCode
                  promoApplied={promoApplied}
                  promoCode={promoCode}
                  onPromoCodeChange={(code) => { setPromoCode(code); clearPromoError(); }}
                  onApplyPromo={handleApplyPromo}
                  onRemovePromo={removePromo}
                  promoError={promoError}
                />
              </div>

              <button
                onClick={() => {
                  if (!phone.trim()) {
                    useToastStore.getState().addToast(t.services.pleaseEnterPhone || "Please enter your phone number", "error");
                    return;
                  }
                  if (!phoneVerified) {
                    useToastStore.getState().addToast("Please verify your phone number before placing the order", "error");
                    return;
                  }
                  setPlacing(true);

                  const orderArgs = {
                    deliveryAddress,
                    paymentMethod,
                    discount,
                    subtotal,
                    scheduledDate,
                    scheduledTime,
                    specialInstructions,
                    tipAmount,
                    isRecurring,
                    recurringFrequency,
                    recurringDayOfWeek,
                    phone: phone.trim(),
                  };

                  if (paymentMethod === "upi" || paymentMethod === "card") {
                    pay({
                      amount: grand + tipAmount,
                      description: `${items.length} item(s) from MIIAM`,
                      onSuccess: (paymentId, razorpayOrderId) => {
                        placeOrder({ ...orderArgs, paymentDetails: { paymentId, razorpayOrderId } })
                          .finally(() => setPlacing(false));
                      },
                      onFailure: () => setPlacing(false),
                    });
                  } else {
                    placeOrder(orderArgs).finally(() => setPlacing(false));
                  }
                }}
                disabled={placing || razorpayLoading || items.length === 0 || !deliveryAddress || !phoneVerified}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 sm:py-5 rounded-xl text-base sm:text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60"
              >
                {(placing || razorpayLoading) ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.checkout.placingOrder}
                  </>
                ) : t.checkout.placeOrder}
                {!placing && <span className="material-symbols-outlined">shield</span>}
              </button>
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
