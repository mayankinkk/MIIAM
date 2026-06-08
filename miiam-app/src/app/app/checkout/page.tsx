"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useLocationStore } from "@/lib/store/locationStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";
import CheckoutDeliveryAddress from "@/components/checkout/CheckoutDeliveryAddress";
import CheckoutScheduledServices from "@/components/checkout/CheckoutScheduledServices";
import CheckoutPrintOrderSummary from "@/components/checkout/CheckoutPrintOrderSummary";
import CheckoutScheduledDelivery from "@/components/checkout/CheckoutScheduledDelivery";
import CheckoutPaymentMethods from "@/components/checkout/CheckoutPaymentMethods";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutPromoCode from "@/components/checkout/CheckoutPromoCode";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SERVICES_VENDOR_ID, PRINTING_VENDOR_ID, PRINT_MENU_ITEM_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : PRINT_MENU_ITEM_ID;
}

interface PromoCode {
  code: string;
  discount_value: number;
  min_order_amount: number;
  discount_type: string;
  is_active: boolean;
  vendor_id?: string;
  max_discount?: number;
  usage_limit?: number;
  used_count?: number;
  valid_until?: string;
}



export default function CheckoutPage() {
  const { t } = useTranslation();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [vendorDeliveryCharges, setVendorDeliveryCharges] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; type: "percent" | "flat" } | null>(null);
  const [promoError, setPromoError] = useState("");
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
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;

  useEffect(() => {
    const hasPrint = items.some(i => i.vendor_id === PRINTING_VENDOR_ID);
    const hasFood = items.some(i => i.vendor_id !== PRINTING_VENDOR_ID && i.vendor_id !== SERVICES_VENDOR_ID);
    if (hasPrint && !hasFood) {
      setPaymentMethod("cod");
    }
    const saved = localStorage.getItem('miiam_selected_address');
    if (saved) {
      try { setDeliveryAddress(JSON.parse(saved)); } catch {}
    }
    const allSaved = localStorage.getItem('miiam_addresses');
    if (allSaved) {
      try { setSavedAddresses(JSON.parse(allSaved)); } catch {}
    }
    async function loadPromoCodes() {
      try {
        const { data } = await supabase
          .from("promo_codes")
          .select("code, discount_value, min_order_amount, discount_type, is_active, vendor_id, max_discount, usage_limit, used_count, valid_until")
          .eq("is_active", true);
        if (data) setPromoCodes(data);
      } catch (err) {
        console.error("Failed to load promo codes:", err);
      }
    }
    loadPromoCodes();

    async function loadVendorDetails() {
      try {
        const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
        if (vendorIds.length === 0) return;
        const { data } = await supabase
          .from("vendors")
          .select("id, delivery_charge")
          .in("id", vendorIds);
        if (data) {
          const charges = data.reduce((acc, v) => {
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
  }, [items]);

  const subtotal = totalPrice();
  const discount = promoApplied
    ? promoApplied.type === "percent"
      ? +(subtotal * (promoApplied.discount / 100)).toFixed(2)
      : promoApplied.discount
    : 0;
  const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
  const serviceVendorIds = vendorIds.filter((id) => id !== PRINTING_VENDOR_ID && id !== SERVICES_VENDOR_ID);
  const totalDeliveryFee = 0; // Delivery is now FREE
  const serviceCharge = 8;
  const grand = Math.max(0, +(subtotal - discount + totalDeliveryFee + (serviceVendorIds.length * serviceCharge) + tipAmount).toFixed(2));

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    const promo = promoCodes.find(p => p.code === code);
    if (!promo) {
      setPromoError("Invalid promo code");
      return;
    }
    if (subtotal < promo.min_order_amount) {
      setPromoError(`Minimum order ₹${promo.min_order_amount} required`);
      return;
    }
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      setPromoError("This promo code has expired");
      return;
    }
    if (promo.usage_limit && promo.used_count !== undefined && promo.used_count >= promo.usage_limit) {
      setPromoError("This promo code has reached its usage limit");
      return;
    }
    if (promo.vendor_id) {
      const hasMatchingVendor = items.some((i) => i.vendor_id === promo.vendor_id);
      if (!hasMatchingVendor) {
        setPromoError("This promo code is not applicable to items in your cart");
        return;
      }
    }
    const discountType = promo.discount_type === "percentage" ? "percent" : "flat";
    let finalDiscount = promo.discount_value;
    if (discountType === "percent") {
      const raw = subtotal * (promo.discount_value / 100);
      finalDiscount = promo.max_discount ? Math.min(raw, promo.max_discount) : raw;
      finalDiscount = +finalDiscount.toFixed(2);
      setPromoApplied({ code, discount: finalDiscount, type: "percent" });
    } else {
      setPromoApplied({ code, discount: finalDiscount, type: "flat" });
    }
    setPromoError("");
    addToast(`Promo code applied!`, "success");
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoCode("");
  };

  const validateCheckout = (): boolean => {
    if (items.length === 0) {
      addToast("Your cart is empty! Add items from the Food page first.", "error");
      return false;
    }
    if (!deliveryAddress) {
      addToast("Please enter your delivery address", "error");
      return false;
    }
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state) {
      addToast("Please enter your complete delivery address", "error");
      return false;
    }
    if (!deliveryAddress.postal_code || deliveryAddress.postal_code.length < 4) {
      addToast("Please enter a valid pincode", "error");
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateCheckout()) return;

    const finalAddress = deliveryAddress
      ? [deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.postal_code].filter(Boolean).join(", ")
      : "452/A Kinetic Plaza, 5th Floor, Skyway Avenue, Tech District, Local Area, State 560001";
    
    if (userPincode && userPincode !== "000000") {
      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean))).filter(v => v !== PRINTING_VENDOR_ID);
      if (vendorIds.length > 0) {
      const { data: vendors } = await supabase.from("vendors").select("id, pincode, name").in("id", vendorIds);
      const unserviceable = vendors?.filter(v => v.pincode && v.pincode !== userPincode) || [];
      if (unserviceable.length > 0) {
        addToast(`Some items (${unserviceable.map(v => v.name).join(", ")}) are not deliverable at your location. Please remove them to proceed.`, "error");
        return;
      }
      }
    }
    
    setPlacing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error("Authentication failed");
      if (!user) { router.push("/auth/login"); return; }

      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean)));
      let firstOrderId = "";

      for (const vendorId of vendorIds) {
        if (!vendorId) continue;
        
        const vendorItems = items.filter((i) => i.vendor_id === vendorId);
        const vendorTotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);

        const scheduledIso = scheduledDate && scheduledTime 
          ? (() => {
              const timePart = scheduledTime.split(" - ")[0].trim();
              const [time, period] = timePart.split(/\s+/);
              let [hours, minutes] = time.split(":").map(Number);
              if (period?.toUpperCase() === "PM" && hours < 12) hours += 12;
              if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
              return new Date(`${scheduledDate}T${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`).toISOString();
            })()
          : null;
        
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: user.id,
              vendor_id: vendorId,
              status: scheduledIso ? "scheduled" : "pending",
              total_amount: vendorTotal,
              delivery_fee: 0,
              discount_amount: subtotal > 0 ? +(discount * (vendorTotal / subtotal)).toFixed(2) : 0,
              payment_method: paymentMethod,
              delivery_address: finalAddress,
              scheduled_delivery: scheduledIso,
              special_instructions: specialInstructions || null,
              placed_at: new Date().toISOString(),
            })
          .select()
          .single();

        if (orderError) throw orderError;

        if (order) {
          if (!firstOrderId) firstOrderId = order.id;

          const { error: itemsError } = await supabase.from("order_items").insert(
            vendorItems.map((i) => ({
              order_id: order.id,
              menu_item_id: safeMenuItemId(i.menu_item_id),
              name: i.name,
              quantity: i.quantity,
              unit_price: i.price,
              price: i.price * i.quantity,
              special_notes: i.special_notes || null,
            }))
          );
          if (itemsError) {
            await supabase.from("orders").delete().eq("id", order.id);
            throw itemsError;
          }

          try {
            await fetch("/api/emails/order-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            });
          } catch (emailErr) {
            console.warn("Failed to send confirmation email:", emailErr);
          }
        }
      }

      // Create recurring schedule if opted in
      if (isRecurring && vendorIds.length === 1 && scheduledDate && scheduledTime) {
        try {
          const { error: scheduleError } = await supabase
            .from("recurring_schedules")
            .insert({
              user_id: user.id,
              vendor_id: vendorIds[0],
              status: "active",
              frequency: recurringFrequency,
              day_of_week: recurringFrequency === "weekly" || recurringFrequency === "biweekly" ? recurringDayOfWeek : null,
              delivery_time: scheduledTime || null,
              delivery_address: finalAddress,
              payment_method: paymentMethod,
              items: items.map((i) => ({
                menu_item_id: i.menu_item_id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image_url: i.image_url || null,
              })),
              start_date: new Date().toISOString(),
              next_delivery_date: (() => {
                const timePart = (scheduledTime || "09:00 AM").split(" - ")[0].trim();
                const [time, period] = timePart.split(/\s+/);
                let [hours, minutes] = time.split(":").map(Number);
                if (period?.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
                return new Date(`${scheduledDate}T${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`).toISOString();
              })(),
            });
          if (scheduleError) console.warn("Failed to create recurring schedule:", scheduleError);
        } catch (scheduleErr) {
          console.warn("Failed to create recurring schedule:", scheduleErr);
        }
      }

      clearCart();
      const msg = isRecurring ? "🎉 Recurring order set up! First order on its way." : "🎉 Order placed! Tracking your order...";
      addToast(msg, "success");
      const targetPath = firstOrderId ? `/app/orders/${firstOrderId}` : "/app/orders";
      router.push(targetPath);
    } catch (error: any) {
      console.error("Order placement failed:", error);
      let errorMessage = "Something went wrong. Please try again.";
      if (error?.message) {
        if (error.message.includes('miiam_food')) {
          errorMessage = "Cart error: Please remove items and add again from Food page.";
        } else if (error.message.includes('violates foreign key')) {
          errorMessage = "Database error: Some items may no longer be available.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error: Please check your internet connection.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      addToast(errorMessage, "error");
    } finally {
      setPlacing(false);
    }
  };

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-surface/80 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/app/cart" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold hidden md:block">Checkout</span>
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart', href: '/app/cart' }, { label: 'Checkout' }]} />

      <main className="pt-20 sm:pt-24 pb-24 px-3 sm:px-6 max-w-7xl mx-auto bg-background text-on-background">
        <header className="mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-2 break-words">{t.checkout.title}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant">{t.checkout.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            <CheckoutDeliveryAddress
              deliveryAddress={deliveryAddress}
              onChangeAddress={() => setShowAddressPicker(true)}
            />

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

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <aside className="bg-surface-container-low p-5 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
              <CheckoutOrderSummary
                items={items}
                subtotal={subtotal}
                discount={discount}
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
                  onPromoCodeChange={(code) => { setPromoCode(code); setPromoError(""); }}
                  onApplyPromo={handleApplyPromo}
                  onRemovePromo={removePromo}
                  promoError={promoError}
                />
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || items.length === 0 || !deliveryAddress}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 sm:py-5 rounded-xl text-base sm:text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : "Place Order"}
                {!placing && <span className="material-symbols-outlined">shield</span>}
              </button>
              <p className="text-center mt-6 text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                100% Encrypted &amp; Secure Payment
              </p>
            </aside>
          </div>
        </div>
      </main>

      {/* Address Picker Bottom Sheet */}
      {showAddressPicker && (
        <AddressPickerSheet
          savedAddresses={savedAddresses}
          onSelect={(addr) => {
            setDeliveryAddress(addr);
            localStorage.setItem('miiam_selected_address', JSON.stringify(addr));
            // Save to address book if new
            const existing = savedAddresses.find(a => a.street === addr.street && a.city === addr.city && a.postal_code === addr.postal_code);
            if (!existing) {
              const updated = [...savedAddresses, addr];
              setSavedAddresses(updated);
              localStorage.setItem('miiam_addresses', JSON.stringify(updated));
            }
            setShowAddressPicker(false);
          }}
          onClose={() => setShowAddressPicker(false)}
        />
      )}
    </>
  );
}
