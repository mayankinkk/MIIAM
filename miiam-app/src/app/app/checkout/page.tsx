"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";

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
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [placing, setPlacing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const tipOptions = [0, 10, 20, 50];
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<{ address: string; lat?: number; lng?: number } | null>(null);
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const supabase = createClient();
  const { addToast } = useToastStore();

  useEffect(() => {
    const saved = localStorage.getItem('miiam_selected_address');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDeliveryAddress(parsed);
      } catch {}
    }
    
    // Load promo codes from database
    async function loadPromoCodes() {
      const { data } = await supabase
        .from("promo_codes")
        .select("code, discount_value, min_order_amount, discount_type, is_active")
        .eq("is_active", true);
      if (data) setPromoCodes(data);
    }
    loadPromoCodes();
  }, []);

  const subtotal = totalPrice();
  const discount = promoApplied
    ? promoApplied.type === "percent"
      ? +(subtotal * (promoApplied.discount / 100)).toFixed(2)
      : promoApplied.discount
    : 0;
  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const deliveryFee = 5.99;
  const grand = +(subtotal - discount + tax + deliveryFee + tipAmount).toFixed(2);

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

  const placeOrder = async () => {
    const finalAddress = deliveryAddress?.address || "452/A Kinetic Plaza, 5th Floor, Skyway Avenue, Tech District, Local Area, State 560001";
    
    if (items.length === 0) {
      alert("Your cart is empty! Add items from the Food page first.");
      return;
    }
    
    setPlacing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error("Authentication failed");
      if (!user) { window.location.href = "/auth/login"; return; }

      const vendorIds = Array.from(new Set(items.map((i) => i.vendor_id)));
      let firstOrderId = "";

      for (const vendorId of vendorIds) {
        if (!vendorId || vendorId.length < 10 || !vendorId.includes("-")) continue;
        
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

          // Only notify riders via the actual notifications system - not as user notifications
          // Riders see new orders in their dashboard automatically from the orders table
        }
      }

      clearCart();
      addToast("Order placed successfully!", "success");
      if (firstOrderId) window.location.href = `/app/orders/${firstOrderId}`;
      else window.location.href = "/app/orders";
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
      alert(errorMessage);
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
      <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
        <div className="w-8 h-8 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-4">
          <Link href="/app/cart" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        </div>
        <span className="text-[#4d212a] font-semibold hidden md:block">Checkout</span>
      </nav>

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#4d212a] mb-2">Secure Checkout</h1>
          <p className="text-[#814c55]">Complete your order with peace of mind.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            {/* Delivery Address */}
            <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-[#ff7670] flex items-center justify-center text-[#4e0006]">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Delivery Address</h2>
                  <p className="text-sm text-[#814c55]">Where should we deliver?</p>
                </div>
                <Link href="/app/addresses" className="text-[#ba001c] font-bold text-sm hover:underline">
                  Change
                </Link>
              </div>
              <Link href="/app/addresses" className="block p-6 rounded-lg border-2 border-[#ba001c] bg-[#ffecee] relative overflow-hidden hover:bg-[#ffe1e4] transition-colors cursor-pointer">
                <div className="absolute top-0 right-0 p-2 bg-[#ba001c] text-white rounded-bl-lg">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba001c]">my_location</span>
                  {deliveryAddress ? "GPS Location" : "Home"}
                </h3>
                <p className="text-[#814c55] text-sm leading-relaxed">
                  {deliveryAddress?.address || "452/A Kinetic Plaza, 5th Floor\nSkyway Avenue, Tech District\nLocal Area, State 560001"}
                </p>
                {deliveryAddress?.lat && (
                  <p className="text-xs text-[#ba001c] mt-2 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">gps_fixed</span>
                    GPS Detected
                  </p>
                )}
              </Link>
              <Link
                href="/app/addresses/add"
                className="mt-4 w-full p-4 rounded-lg border-2 border-dashed border-[#dd9ca6]/50 flex items-center justify-center gap-2 text-[#814c55] hover:border-[#ba001c] hover:text-[#ba001c] transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                Add New Address
              </Link>
            </section>

            {/* Scheduled Services */}
            {items.some(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000") && (
              <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534]">
                    <span className="material-symbols-outlined">event_available</span>
                  </div>
                  <h2 className="text-2xl font-bold">Scheduled Services</h2>
                </div>
                <div className="space-y-4">
                  {items.filter(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000").map(item => (
                    <div key={item.menu_item_id} className="p-4 rounded-lg border border-[#dd9ca6]/20 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{item.name.split(' (')[0]}</h3>
                        <p className="text-sm text-[#0b50d5] flex items-center gap-1 font-semibold mt-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {item.name.includes('(') ? item.name.substring(item.name.indexOf('(') + 1, item.name.lastIndexOf(')')) : "Scheduled"}
                        </p>
                      </div>
                      <div className="font-bold text-[#ba001c]">₹{item.price} x {item.quantity}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled Delivery */}
            {!items.some(i => i.vendor_id === "5e700000-0000-4000-8000-000000000000") && (
              <section className="bg-white p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center text-[#92400e]">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Schedule Delivery</h2>
                    <p className="text-sm text-[#814c55]">Select date & time for delivery</p>
                  </div>
                </div>
                
                {/* Date Picker */}
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-4 rounded-lg border-2 border-[#dd9ca6]/30 flex items-center justify-between hover:border-[#ba001c] transition-all mb-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ba001c]">calendar_month</span>
                    <span className={scheduledDate ? "font-bold text-[#4d212a]" : "text-[#814c55]"}>
                      {scheduledDate || "Select a date"}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#ba001c]">
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
                      className="w-full p-4 rounded-lg border-2 border-[#dd9ca6]/30 focus:border-[#ba001c] focus:outline-none"
                    />
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {[0, 1, 2, 3].map((days) => {
                        const date = new Date();
                        date.setDate(date.getDate() + days);
                        const dateStr = date.toISOString().split('T')[0];
                        const label = days === 0 ? "Today" : days === 1 ? "Tomorrow" : date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
                        return (
                          <button
                            key={days}
                            onClick={() => setScheduledDate(dateStr)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                              scheduledDate === dateStr
                                ? "bg-[#ba001c] text-white border-[#ba001c]"
                                : "border-[#dd9ca6]/30 hover:border-[#ba001c]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Time Picker */}
                <button
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className="w-full p-4 rounded-lg border-2 border-[#dd9ca6]/30 flex items-center justify-between hover:border-[#ba001c] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ba001c]">access_time</span>
                    <span className={scheduledTime ? "font-bold text-[#4d212a]" : "text-[#814c55]"}>
                      {scheduledTime || "Select a time slot"}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#ba001c]">
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
                            ? "bg-[#ba001c] text-white border-[#ba001c]"
                            : "border-[#dd9ca6]/30 hover:border-[#ba001c]"
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
                        ? "bg-[#ffecee] border-2 border-[#ba001c]"
                        : "hover:bg-[#ffecee] border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="w-5 h-5 text-[#ba001c]"
                      />
                      <span className="material-symbols-outlined text-[#0b50d5]">{pm.icon}</span>
                      <div>
                        <p className="font-bold">{pm.label}</p>
                        <p className="text-xs text-[#814c55]">{pm.sub}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-4 sticky top-24">
            <aside className="bg-[#ffecee] p-8 rounded-lg shadow-[0px_20px_40px_rgba(77,33,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff7670]/20 rounded-full blur-3xl" />
              <h2 className="text-2xl font-extrabold mb-8 tracking-tight">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[#814c55]">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-[#4d212a]">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#814c55]">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-[#0b50d5]">FREE</span>
                </div>
                <div className="flex justify-between text-[#814c55]">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-[#4d212a]">₹{tax}</span>
                </div>
                
                {/* Rider Tip */}
                <div className="py-3 border-t border-dashed border-[#dd9ca6]/30">
                  <p className="text-sm font-bold text-[#4d212a] mb-2">Tip your rider 🧡</p>
                  <div className="flex gap-2">
                    {tipOptions.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTipAmount(amount)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                          tipAmount === amount
                            ? "bg-[#ba001c] text-white border-[#ba001c]"
                            : "bg-white text-[#4d212a] border-slate-200 hover:border-[#ba001c]"
                        }`}
                      >
                        {amount === 0 ? "No Tip" : `₹${amount}`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#dd9ca6]/30 flex justify-between items-end">
                  <span className="text-lg font-bold">Total Amount</span>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-[#ba001c] tracking-tighter">₹{grand}</p>
                    <p className="text-[10px] text-[#814c55] uppercase tracking-widest font-bold">Inc. all taxes</p>
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
                      className="w-full bg-white border-none rounded-xl py-4 pl-4 pr-32 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      type="text"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-[#4d212a] text-white rounded-lg font-bold text-xs hover:bg-black transition-colors"
                    >
                      APPLY
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                <p className="text-xs text-[#814c55] mt-2">Try: FIRST50, MIIAM20, SAVE50</p>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || items.length === 0}
                className="w-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white py-5 rounded-xl text-lg font-extrabold shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {placing ? "Placing Order..." : "Place Order"}
                {!placing && <span className="material-symbols-outlined">shield</span>}
              </button>
              <p className="text-center mt-6 text-xs text-[#814c55] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">lock</span>
                100% Encrypted &amp; Secure Payment
              </p>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
