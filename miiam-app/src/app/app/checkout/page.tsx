"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useLocationStore } from "@/lib/store/locationStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";
import { RiderTipSelector, TipThankYou } from "@/components/RiderTip";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SERVICES_VENDOR_ID, PRINTING_VENDOR_ID, PRINT_MENU_ITEM_ID } from "@/lib/constants";

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
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [vendorDeliveryCharges, setVendorDeliveryCharges] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; type: "percent" | "flat" } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [dateOptions, setDateOptions] = useState<{ label: string; value: string }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    const options = [0, 1, 2, 3].map((days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return {
        value: date.toISOString().split('T')[0],
        label: days === 0 ? "Today" : days === 1 ? "Tomorrow" : date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
    setDateOptions(options);
  }, []);
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
    if (items.some(i => i.vendor_id === PRINTING_VENDOR_ID)) {
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
  const totalDeliveryFee = 0; // Delivery is now FREE
  const serviceCharge = 8;
  const grand = Math.max(0, +(subtotal - discount + totalDeliveryFee + (vendorIds.length * serviceCharge) + tipAmount).toFixed(2));

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
      const cartVendor = items[0]?.vendor_id;
      if (cartVendor && cartVendor !== promo.vendor_id) {
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

  const timeSlots = [
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM",
    "07:00 PM - 09:00 PM",
  ];

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
      if (isRecurring && vendorIds.length === 1) {
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
              next_delivery_date: new Date(`${scheduledDate}T${(scheduledTime || "09:00 AM").split(" - ")[0].trim()}`).toISOString(),
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
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-surface/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/app/cart" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold hidden md:block">Checkout</span>
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart', href: '/app/cart' }, { label: 'Checkout' }]} />

      <main className="pt-20 sm:pt-24 pb-24 sm:pb-32 px-3 sm:px-6 max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-2 break-words">Secure Checkout</h1>
          <p className="text-sm sm:text-base text-on-surface-variant">Complete your order with peace of mind.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            {/* Delivery Address */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-on-surface">Delivery Address</h2>
                  <p className="text-xs text-on-surface-variant">Where should we deliver?</p>
                </div>
                <button
                  onClick={() => setShowAddressPicker(true)}
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
                      <p className="text-xs text-slate-400 mt-1 break-words">📍 Near {deliveryAddress.landmark}</p>
                    )}
                  </div>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="w-full p-4 sm:p-5 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface transition-all"
                >
                  <span className="material-symbols-outlined text-3xl">add_location</span>
                  <span className="font-bold text-sm sm:text-base">Add Delivery Address</span>
                  <span className="text-xs">GPS auto-detect or enter manually</span>
                </button>
              )}

              {deliveryAddress && (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/40 text-xs sm:text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Use a Different Address
                </button>
              )}
            </section>

            {/* Scheduled Services */}
            {items.some(i => i.vendor_id === SERVICES_VENDOR_ID) && (
              <section className="bg-white p-5 sm:p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                    <span className="material-symbols-outlined">event_available</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">Scheduled Services</h2>
                </div>
                <div className="space-y-4">
                  {items.filter(i => i.vendor_id === SERVICES_VENDOR_ID).map(item => (
                    <div key={item.id} className="p-4 rounded-lg border border-outline-variant/20 bg-slate-50 flex justify-between items-center">
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
            )}

            {/* Print Order Summary */}
            {items.some(i => i.vendor_id === PRINTING_VENDOR_ID) && (
              <section className="bg-white p-5 sm:p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
                    <span className="material-symbols-outlined">print</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold">Print Order</h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant">We'll print & deliver in minutes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.filter(i => i.vendor_id === PRINTING_VENDOR_ID).map(item => {
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
            )}

            {/* Scheduled Delivery */}
            {!items.some(i => i.vendor_id === SERVICES_VENDOR_ID) && (
              <section className="bg-white p-5 sm:p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold">Schedule Delivery</h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant">Select date & time for delivery</p>
                  </div>
                </div>
                
                {/* Date Picker */}
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-4 rounded-lg border-2 border-outline-variant/30 flex items-center justify-between hover:border-primary transition-all mb-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <span className={scheduledDate ? "font-bold text-on-surface" : "text-on-surface-variant"}>
                      {scheduledDate || "Select a date"}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    {showDatePicker ? "expand_less" : "expand_more"}
                  </span>
                </button>
                
                {showDatePicker && (
                  <div className="mb-4">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full p-4 rounded-lg border-2 border-outline-variant/30 focus:border-primary focus:outline-none"
                    />
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {dateOptions.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setScheduledDate(d.value)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            scheduledDate === d.value
                              ? "bg-primary text-white border-primary"
                              : "border-outline-variant/30 hover:border-primary"
                          }`}
                        >
                          {d.label}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Time Picker */}
                <button
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className="w-full p-4 rounded-lg border-2 border-outline-variant/30 flex items-center justify-between hover:border-primary transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">access_time</span>
                    <span className={scheduledTime ? "font-bold text-on-surface" : "text-on-surface-variant"}>
                      {scheduledTime || "Select a time slot"}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary">
                    {showTimePicker ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {showTimePicker && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => { setScheduledTime(slot); setShowTimePicker(false); }}
                        className={`p-3 rounded-lg text-xs sm:text-sm font-semibold border transition-all text-left ${
                          scheduledTime === slot
                            ? "bg-primary text-white border-primary"
                            : "border-outline-variant/30 hover:border-primary"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Clear Schedule */}
                {(scheduledDate || scheduledTime) && (
                  <button
                    onClick={() => { setScheduledDate(""); setScheduledTime(""); setIsRecurring(false); }}
                    className="mt-4 w-full p-3 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Clear Schedule
                  </button>
                )}

                {/* Recurring Order Toggle */}
                {scheduledDate && scheduledTime && (
                  <div className="mt-6 p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
                    <label className="flex items-center justify-between cursor-pointer gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-symbols-outlined text-purple-600 shrink-0">repeat</span>
                        <div className="min-w-0">
                          <p className="font-bold text-purple-800 text-sm">Make this a recurring order</p>
                          <p className="text-xs text-purple-600">Auto-reorder on schedule</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded shrink-0"
                      />
                    </label>

                    {isRecurring && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-xs font-bold text-purple-700 block mb-1">Repeat every</label>
                          <select
                            value={recurringFrequency}
                            onChange={(e) => setRecurringFrequency(e.target.value)}
                            className="w-full p-3 rounded-lg border-2 border-purple-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Every 2 weeks</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        {(recurringFrequency === "weekly" || recurringFrequency === "biweekly") && (
                          <div>
                            <label className="text-xs font-bold text-purple-700 block mb-1">On day</label>
                            <select
                              value={recurringDayOfWeek}
                              onChange={(e) => setRecurringDayOfWeek(Number(e.target.value))}
                              className="w-full p-3 rounded-lg border-2 border-purple-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
                            >
                              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                                <option key={day} value={i}>{day}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <p className="text-xs text-purple-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Orders will be created automatically on your chosen schedule
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Scheduled Order Info */}
                {scheduledDate && scheduledTime && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div className="min-w-0">
                      <p className="font-bold text-green-700">Scheduled for delivery</p>
                      <p className="text-sm text-green-600 break-words">
                        {new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduledTime}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Payment Method */}
            <section className="bg-white p-5 sm:p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#c4d0ff] flex items-center justify-center text-[#003dac] shrink-0">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Payment Method</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { id: "upi", label: "UPI Payment", sub: "Google Pay, PhonePe, Paytm", icon: "qr_code_scanner" },
                  { id: "cod", label: "Cash on Delivery", sub: "Pay when you receive the order", icon: "payments" },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center justify-between p-4 sm:p-6 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? "bg-surface-container-low border-2 border-primary"
                        : "hover:bg-surface-container-low border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="w-5 h-5 text-primary shrink-0"
                      />
                      <span className="material-symbols-outlined text-secondary shrink-0">{pm.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base truncate">{pm.label}</p>
                        <p className="text-xs text-on-surface-variant truncate">{pm.sub}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <aside className="bg-surface-container-low p-5 sm:p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
              <h2 className="text-xl sm:text-2xl font-extrabold mb-6 sm:mb-8 tracking-tight">Order Summary</h2>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-on-surface">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Delivery Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Service Charge</span>
                    <span className="font-semibold text-on-surface">₹{(vendorIds.length * serviceCharge).toFixed(2)}</span>
                </div>
                
                {/* Print Settings Summary */}
                {items.filter(i => i.vendor_id === PRINTING_VENDOR_ID).map(item => {
                  let s: Record<string, any> = {};
                  try { if (item.special_notes) s = JSON.parse(item.special_notes); } catch {}
                  if (!s.pages) return null;
                  return (
                    <div key={item.menu_item_id} className="py-3 border-t border-dashed border-outline-variant/30">
                      <p className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print Settings
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.pages && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{s.pages}pg</span>}
                        {s.copies && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{s.copies}cp</span>}
                        {s.colorMode && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{s.colorMode === "bw" ? "B&W" : "Color"}</span>}
                        {s.paperSize && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold uppercase">{s.paperSize}</span>}
                        {s.orientation && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold capitalize">{s.orientation}</span>}
                        {s.paperType && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{s.paperType}</span>}
                        {s.sides && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{s.sides} sided</span>}
                      </div>
                    </div>
                  );
                })}

                {/* Rider Tip */}
                <div className="py-3 border-t border-dashed border-outline-variant/30">
                  {showTipSelector ? (
                    <RiderTipSelector 
                      orderAmount={subtotal} 
                      onTipSelect={(amount) => { setTipAmount(amount); setShowTipSelector(false); }} 
                      onSkip={() => { setTipAmount(0); setShowTipSelector(false); }} 
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-on-surface">Rider Tip</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">₹{tipAmount}</span>
                          <button onClick={() => setShowTipSelector(true)} className="text-xs text-blue-600 underline">Edit</button>
                        </div>
                      </div>
                      {tipAmount > 0 && <TipThankYou amount={tipAmount} />}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end gap-2">
                  <span className="text-base sm:text-lg font-bold">Total Amount</span>
                  <div className="text-right min-w-0">
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tighter truncate">₹{grand}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Inc. all taxes</p>
                  </div>
                </div>
              </div>


              {/* Promo Code */}
              <div className="mb-6 sm:mb-8">
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 sm:p-4 rounded-xl gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-green-600 shrink-0">local_offer</span>
                      <div className="min-w-0">
                        <p className="font-bold text-green-700 truncate">{promoApplied.code}</p>
                        <p className="text-xs text-green-600">-{promoApplied.type === "percent" ? `${promoApplied.discount}%` : `₹${promoApplied.discount}`}</p>
                      </div>
                    </div>
                    <button onClick={removePromo} className="text-green-700 text-sm font-bold shrink-0">Remove</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full bg-white border-none rounded-xl py-3.5 sm:py-4 pl-3 sm:pl-4 pr-24 sm:pr-32 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      type="text"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3 sm:px-4 bg-on-surface text-white rounded-lg font-bold text-xs hover:bg-black transition-colors"
                    >
                      APPLY
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                <p className="text-xs text-on-surface-variant mt-2">Try: FIRST50, MIIAM20, SAVE50</p>
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
            const existing = savedAddresses.find(a => a.street === addr.street);
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
