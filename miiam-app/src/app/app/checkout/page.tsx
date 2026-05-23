"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useLocationStore } from "@/lib/store/locationStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";
import { RiderTipSelector, TipThankYou } from "@/components/RiderTip";
import Breadcrumbs from "@/components/Breadcrumbs";

interface PromoCode {
  code: string;
  discount_value: number;
  min_order_amount: number;
  discount_type: string;
  is_active: boolean;
}



export default function CheckoutPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; type: "percent" | "flat" } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [dateOptions, setDateOptions] = useState<{ label: string; value: string }[]>([]);

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<SelectedAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SelectedAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const supabase = createClient();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;

  useEffect(() => {
    if (!userPincode) {
      locationStore.setLocation({ pincode: "000000", displayAddress: "Checking..." });
    }
  }, []);

  useEffect(() => {
    // Read URL params
    try {
      const params = new URLSearchParams(window.location.search);
      const redeemPts = Number(params.get("redeemPts"));
      if (redeemPts > 0) {
        setUseLoyaltyPoints(true);
        setLoyaltyPointsToRedeem(redeemPts);
      }
    } catch (e) {}

    const saved = localStorage.getItem('miiam_selected_address');
    if (saved) {
      try { setDeliveryAddress(JSON.parse(saved)); } catch {}
    }
    const allSaved = localStorage.getItem('miiam_addresses');
    if (allSaved) {
      try { setSavedAddresses(JSON.parse(allSaved)); } catch {}
    }
    async function loadPromoCodes() {
      const { data } = await supabase
        .from("promo_codes")
        .select("code, discount_value, min_order_amount, discount_type, is_active")
        .eq("is_active", true);
      if (data) setPromoCodes(data);
    }
    loadPromoCodes();

    async function loadLoyaltyPoints() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_loyalty_points")
          .eq("id", user.id)
          .single();
        if (profile) setLoyaltyPoints(profile.total_loyalty_points || 0);
      }
    }
    loadLoyaltyPoints();
  }, []);

  const subtotal = totalPrice();
  const discount = promoApplied
    ? promoApplied.type === "percent"
      ? +(subtotal * (promoApplied.discount / 100)).toFixed(2)
      : promoApplied.discount
    : 0;
  const loyaltyDiscount = useLoyaltyPoints ? +(loyaltyPointsToRedeem * 0.1).toFixed(2) : 0;
  const baseAmountForTax = Math.max(0, subtotal - discount - loyaltyDiscount);
  const tax = +(baseAmountForTax * 0.05).toFixed(2);
  const deliveryFee = 5.99;
  const grand = Math.max(0, +(subtotal - discount - loyaltyDiscount + tax + deliveryFee + tipAmount).toFixed(2));
  const maxRedeemable = Math.min(loyaltyPoints, Math.floor((subtotal - discount + deliveryFee + tipAmount) / 0.1));

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
    const discountType = promo.discount_type === "percentage" ? "percent" : "flat";
    setPromoApplied({ code, discount: promo.discount_value, type: discountType });
    setPromoError("");
    addToast(`Promo code applied: ${promo.discount_value}${discountType === "percent" ? "%" : "₹"} off`, "success");
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
      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id)));
      const { data: vendors } = await supabase.from("vendors").select("id, pincode, name").in("id", vendorIds);
      const unserviceable = vendors?.filter(v => v.pincode && v.pincode !== userPincode) || [];
      if (unserviceable.length > 0) {
        addToast(`Some items (${unserviceable.map(v => v.name).join(", ")}) are not deliverable at your location. Please remove them to proceed.`, "error");
        return;
      }
    }
    
    setPlacing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error("Authentication failed");
      if (!user) { router.push("/auth/login"); return; }

      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id)));
      let firstOrderId = "";

      for (const vendorId of vendorIds) {
        if (!vendorId) continue;
        
        const vendorItems = items.filter((i) => i.vendor_id === vendorId);
        const vendorTotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);

        const scheduledDelivery = scheduledDate && scheduledTime 
          ? `${new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at ${scheduledTime}`
          : null;
        
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            vendor_id: vendorId,
            status: scheduledDelivery ? "scheduled" : "pending",
            total_amount: vendorTotal,
            delivery_fee: 5.99,
            discount_amount: discount,
            payment_method: paymentMethod,
            delivery_address: finalAddress,
            special_instructions: scheduledDelivery || null,
            placed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (order) {
          if (!firstOrderId) firstOrderId = order.id;
          
          const formatAsUuid = (id: string) => {
            if (id?.length > 20 && id.includes('-')) return id;
            const hex = id?.replace(/[^0-9a-fA-F]/g, '0').padStart(12, '0') || '000000000000';
            return `00000000-0000-4000-8000-${hex}`;
          };

          const { error: itemsError } = await supabase.from("order_items").insert(
            vendorItems.map((i) => ({
              order_id: order.id,
              menu_item_id: formatAsUuid(i.menu_item_id),
              name: i.name,
              quantity: i.quantity,
              unit_price: i.price,
              price: i.price * i.quantity,
            }))
          );
          if (itemsError) throw itemsError;

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

      // Redeem loyalty points if selected
      if (useLoyaltyPoints && loyaltyPointsToRedeem > 0 && user) {
        try {
          await fetch("/api/loyalty/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              points: loyaltyPointsToRedeem,
              order_id: firstOrderId,
            }),
          });
        } catch (e) {
          console.error("[checkout] Loyalty redemption error:", e);
          addToast("Failed to redeem loyalty points. Please try again.", "error");
        }
      }

      clearCart();
      addToast("🎉 Order placed! Tracking your order...", "success");
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

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-4">
          <Link href="/app/cart" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold hidden md:block">Checkout</span>
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart', href: '/app/cart' }, { label: 'Checkout' }]} />

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-2">Secure Checkout</h1>
          <p className="text-on-surface-variant">Complete your order with peace of mind.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            {/* Delivery Address */}
            <section className="bg-white p-6 rounded-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-3 mb-5">
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
                <div className="p-4 rounded-xl border-2 border-primary bg-[#fff8f8] flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {deliveryAddress.type === "office" ? "business" : deliveryAddress.type === "other" ? "place" : "home"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-on-surface flex items-center gap-2">
                      {deliveryAddress.label || "Home"}
                      {deliveryAddress.lat && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">gps_fixed</span>GPS
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                      {[deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(", ")}
                    </p>
                    {deliveryAddress.landmark && (
                      <p className="text-xs text-slate-400 mt-1">📍 Near {deliveryAddress.landmark}</p>
                    )}
                  </div>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="w-full p-5 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface transition-all"
                >
                  <span className="material-symbols-outlined text-3xl">add_location</span>
                  <span className="font-bold">Add Delivery Address</span>
                  <span className="text-xs">GPS auto-detect or enter manually</span>
                </button>
              )}

              {deliveryAddress && (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Use a Different Address
                </button>
              )}
            </section>

            {/* Scheduled Services */}
            {items.some(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000") && (
              <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                    <span className="material-symbols-outlined">event_available</span>
                  </div>
                  <h2 className="text-2xl font-bold">Scheduled Services</h2>
                </div>
                <div className="space-y-4">
                  {items.filter(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000").map(item => (
                    <div key={item.menu_item_id} className="p-4 rounded-lg border border-outline-variant/20 bg-slate-50 flex justify-between items-center">
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

            {/* Scheduled Delivery */}
            {!items.some(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000") && (
              <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Schedule Delivery</h2>
                    <p className="text-sm text-on-surface-variant">Select date & time for delivery</p>
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
                          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
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
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => { setScheduledTime(slot); setShowTimePicker(false); }}
                        className={`p-3 rounded-lg text-sm font-semibold border transition-all ${
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
                    onClick={() => { setScheduledDate(""); setScheduledTime(""); }}
                    className="mt-4 w-full p-3 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Clear Schedule
                  </button>
                )}
                
                {/* Scheduled Order Info */}
                {scheduledDate && scheduledTime && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div>
                      <p className="font-bold text-green-700">Scheduled for delivery</p>
                      <p className="text-sm text-green-600">
                        {new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduledTime}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Payment Method */}
            <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-[#c4d0ff] flex items-center justify-center text-[#003dac]">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <h2 className="text-2xl font-bold">Payment Method</h2>
              </div>
              <div className="space-y-4">
                {[
                  { id: "wallet", label: "MIIAM Wallet", sub: "Balance: ₹500.00", icon: "account_balance_wallet" },
                  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex", icon: "credit_card" },
                  { id: "upi", label: "UPI Payment", sub: "Google Pay, PhonePe, Paytm", icon: "qr_code_scanner" },
                  { id: "cod", label: "Cash on Delivery", sub: "Pay when you receive the order", icon: "payments" },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center justify-between p-6 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? "bg-surface-container-low border-2 border-primary"
                        : "hover:bg-surface-container-low border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="w-5 h-5 text-primary"
                      />
                      <span className="material-symbols-outlined text-secondary">{pm.icon}</span>
                      <div>
                        <p className="font-bold">{pm.label}</p>
                        <p className="text-xs text-on-surface-variant">{pm.sub}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 sticky top-24">
            <aside className="bg-surface-container-low p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
              <h2 className="text-2xl font-extrabold mb-8 tracking-tight">Order Summary</h2>
              <div className="space-y-4 mb-8">
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
                  <span className="font-semibold text-secondary">FREE</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-on-surface">₹{tax}</span>
                </div>
                
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
                
                {/* Loyalty Points Redemption */}
                {loyaltyPoints > 0 && (
                  <div className="py-3 border-t border-dashed border-outline-variant/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-on-surface">💎 Use Loyalty Points</p>
                      <span className="text-xs text-on-surface-variant">{loyaltyPoints} points available</span>
                    </div>
                    <div className="mt-3 bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500">Slide to adjust</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setUseLoyaltyPoints(false);
                              setLoyaltyPointsToRedeem(0);
                            }}
                            className="text-[10px] font-bold text-slate-500 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              setUseLoyaltyPoints(true);
                              setLoyaltyPointsToRedeem(maxRedeemable);
                            }}
                            className="text-[10px] font-bold text-[#453900] px-2 py-1 rounded bg-[#ffd709] hover:bg-tertiary-dim"
                          >
                            Use Max
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={maxRedeemable}
                          step={10}
                          value={loyaltyPointsToRedeem}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLoyaltyPointsToRedeem(val);
                            setUseLoyaltyPoints(val > 0);
                          }}
                          className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="shrink-0 w-16 text-right font-bold text-on-surface bg-surface-container-low px-2 py-1 rounded-md">
                          {loyaltyPointsToRedeem}
                        </div>
                      </div>
                    </div>
                    {useLoyaltyPoints && loyaltyPointsToRedeem > 0 && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ Using {loyaltyPointsToRedeem} points = ₹{(loyaltyPointsToRedeem * 0.1).toFixed(2)} off
                      </p>
                    )}
                  </div>
                )}
                
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-end">
                  <span className="text-lg font-bold">Total Amount</span>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-primary tracking-tighter">₹{grand}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Inc. all taxes</p>
                  </div>
                </div>
              </div>



              {/* Promo Code */}
              <div className="mb-8">
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600">local_offer</span>
                      <div>
                        <p className="font-bold text-green-700">{promoApplied.code}</p>
                        <p className="text-xs text-green-600">-{promoApplied.type === "percent" ? `${promoApplied.discount}%` : `₹${promoApplied.discount}`}</p>
                      </div>
                    </div>
                    <button onClick={removePromo} className="text-green-700 text-sm font-bold">Remove</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full bg-white border-none rounded-xl py-4 pl-4 pr-32 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      type="text"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-on-surface text-white rounded-lg font-bold text-xs hover:bg-black transition-colors"
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
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-5 rounded-xl text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
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
