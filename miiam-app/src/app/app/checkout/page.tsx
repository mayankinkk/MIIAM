"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import AddressPickerSheet, { type SelectedAddress } from "@/components/AddressPickerSheet";

interface PromoCode {
  code: string;
  discount_value: number;
  min_order_amount: number;
  discount_type: string;
  is_active: boolean;
}

function ConfettiOverlay() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ["#ffd700", "#ff7670", "#ba001c", "#38bdf8", "#34d399", "#c084fc"];
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 20 - 10,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.3,
      duration: Math.random() * 1.2 + 0.8,
      angle: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationIterationCount: 1,
            animationFillMode: "forwards",
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(140px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}} />
    </div>
  );
}

function CouponReveal({ code, discount, onReveal }: { code: string; discount: string; onReveal: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);

  // Use a ref to capture the latest onReveal and avoid dependencies re-triggering the useEffect
  const onRevealRef = useRef(onReveal);
  useEffect(() => {
    onRevealRef.current = onReveal;
  });

  // Call onReveal once when revealed is set to true
  useEffect(() => {
    if (revealed) {
      const timer = setTimeout(() => {
        onRevealRef.current();
      }, 700); // Trigger callback slightly after reveal transition
      return () => clearTimeout(timer);
    }
  }, [revealed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on container
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = containerRef.current?.getBoundingClientRect();
      canvas.width = rect?.width || 320;
      canvas.height = rect?.height || 100;

      // Draw scratch layer
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create a gorgeous gradient for the scratch layer
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#ba001c");
      grad.addColorStop(0.5, "#ff7670");
      grad.addColorStop(1, "#fecfef");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw elegant golden sparkles/dots patterns on the scratch layer
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add a stylish overlay border pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      // Add "Scratch Card" text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 4;
      ctx.fillText("🎁 EXCLUSIVE GIFT 🎁", canvas.width / 2, canvas.height / 2 - 10);

      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText("Scratch with finger or mouse to reveal!", canvas.width / 2, canvas.height / 2 + 14);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [revealed]);

  // Handle scratching logic
  const scratch = (clientX: number, clientY: number, isStarting = false) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 45; // thick brush for scratch

    ctx.beginPath();
    if (isStarting || lastX.current === null || lastY.current === null) {
      ctx.arc(x, y, 22.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(lastX.current, lastY.current);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastX.current = x;
    lastY.current = y;

    // Check cleared percentage
    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let clearedCount = 0;

    // Check every 4th pixel (alpha channel) for performance
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        clearedCount++;
      }
    }

    const totalPixels = pixels.length / 16;
    const percentage = (clearedCount / totalPixels) * 100;

    if (percentage > 40) {
      setRevealed(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY, true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
    lastX.current = null;
    lastY.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsScratching(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    if (e.touches[0]) {
      // Prevent scrolling when scratching
      if (e.cancelable) e.preventDefault();
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
    lastX.current = null;
    lastY.current = null;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100px] rounded-2xl overflow-hidden shadow-inner border border-[#dd9ca6]/30 bg-gradient-to-br from-[#1e1b29] to-[#0d0b14] p-0.5 select-none"
    >
      {/* Revealed content (Underneath) */}
      <div className="absolute inset-0 flex items-center justify-between px-6 bg-gradient-to-r from-[#1a131b] via-[#2d111d] to-[#1a131b]">
        {/* Decorative elements */}
        <div className="absolute -left-6 -top-6 w-16 h-16 bg-[#ba001c]/25 rounded-full blur-xl" />
        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#ff7670]/25 rounded-full blur-xl" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl shadow-lg border border-amber-300">
            <span className="material-symbols-outlined text-white text-2xl animate-bounce">local_offer</span>
          </div>
          <div>
            <p className="text-amber-400 font-extrabold text-[10px] uppercase tracking-widest flex items-center gap-1">
              🎉 Unlocked!
            </p>
            <p className="text-white font-black text-2xl tracking-tight leading-none mt-1">{code}</p>
            <p className="text-slate-300 text-xs font-semibold mt-1">{discount} off your order</p>
          </div>
        </div>

        {/* Action instruction */}
        <div className="text-right z-10">
          <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-extrabold px-3 py-1 rounded-full animate-pulse">
            COPIED!
          </span>
          <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Applied automatically</p>
        </div>

        {/* Small sparkling particles */}
        {revealed && <ConfettiOverlay />}
      </div>

      {/* Canvas scratch layer */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 w-full h-full z-20 cursor-crosshair touch-none transition-opacity duration-500 ease-out"
        />
      )}
    </div>
  );
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

  const placeOrder = async () => {
    const finalAddress = deliveryAddress
      ? [deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.postal_code].filter(Boolean).join(", ")
      : "452/A Kinetic Plaza, 5th Floor, Skyway Avenue, Tech District, Local Area, State 560001";
    
    if (items.length === 0) {
      alert("Your cart is empty! Add items from the Food page first.");
      return;
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
            <section className="bg-white p-6 rounded-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#ffe1e4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#ba001c]">location_on</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-[#4d212a]">Delivery Address</h2>
                  <p className="text-xs text-[#814c55]">Where should we deliver?</p>
                </div>
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="text-[#ba001c] font-bold text-sm bg-[#fff4f4] px-3 py-1.5 rounded-lg hover:bg-[#ffe1e4] transition-colors"
                >
                  Change
                </button>
              </div>

              {deliveryAddress ? (
                <div className="p-4 rounded-xl border-2 border-[#ba001c] bg-[#fff8f8] flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#ffe1e4] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#ba001c]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {deliveryAddress.type === "office" ? "business" : deliveryAddress.type === "other" ? "place" : "home"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#4d212a] flex items-center gap-2">
                      {deliveryAddress.label || "Home"}
                      {deliveryAddress.lat && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">gps_fixed</span>GPS
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#814c55] mt-1 leading-relaxed">
                      {[deliveryAddress.flat, deliveryAddress.street, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(", ")}
                    </p>
                    {deliveryAddress.landmark && (
                      <p className="text-xs text-slate-400 mt-1">📍 Near {deliveryAddress.landmark}</p>
                    )}
                  </div>
                  <div className="w-6 h-6 bg-[#ba001c] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="w-full p-5 rounded-xl border-2 border-dashed border-[#dd9ca6]/50 flex flex-col items-center gap-2 text-[#814c55] hover:border-[#ba001c] hover:text-[#ba001c] hover:bg-[#fff4f4] transition-all"
                >
                  <span className="material-symbols-outlined text-3xl">add_location</span>
                  <span className="font-bold">Add Delivery Address</span>
                  <span className="text-xs">GPS auto-detect or enter manually</span>
                </button>
              )}

              {deliveryAddress && (
                <button
                  onClick={() => setShowAddressPicker(true)}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-[#dd9ca6]/40 text-sm font-bold text-[#814c55] hover:border-[#ba001c] hover:text-[#ba001c] flex items-center justify-center gap-2 transition-all"
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
                
                {/* Loyalty Points Redemption */}
                {loyaltyPoints > 0 && (
                  <div className="py-3 border-t border-dashed border-[#dd9ca6]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-[#4d212a]">💎 Use Loyalty Points</p>
                      <span className="text-xs text-[#814c55]">{loyaltyPoints} points available</span>
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
                            className="text-[10px] font-bold text-[#453900] px-2 py-1 rounded bg-[#ffd709] hover:bg-[#e5c100]"
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
                          className="w-full accent-[#ba001c] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="shrink-0 w-16 text-right font-bold text-[#4d212a] bg-[#ffecee] px-2 py-1 rounded-md">
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
                
                <div className="pt-4 border-t border-[#dd9ca6]/30 flex justify-between items-end">
                  <span className="text-lg font-bold">Total Amount</span>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-[#ba001c] tracking-tighter">₹{grand}</p>
                    <p className="text-[10px] text-[#814c55] uppercase tracking-widest font-bold">Inc. all taxes</p>
                  </div>
                </div>
              </div>

              {/* Hidden Coupon Reveal Animation */}
              {!promoApplied && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#814c55] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base animate-pulse">auto_awesome</span>
                    Exclusive for you
                  </p>
                  <CouponReveal
                    code="MIIAM50"
                    discount="₹50"
                    onReveal={() => {
                      setPromoCode("MIIAM50");
                      addToast("Coupon copied! Apply it below.", "info");
                    }}
                  />
                </div>
              )}

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
