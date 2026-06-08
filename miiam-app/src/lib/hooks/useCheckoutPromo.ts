"use client";

import { useState, useCallback } from "react";
import { useToastStore } from "@/lib/store/toastStore";
import type { PromoCode } from "@/lib/checkout-utils";

export function useCheckoutPromo({
  promoCodes,
  subtotal,
  items,
}: {
  promoCodes: PromoCode[];
  subtotal: number;
  items: { vendor_id?: string }[];
}) {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; type: "percent" | "flat" } | null>(null);
  const [promoError, setPromoError] = useState("");
  const { addToast } = useToastStore();

  const handleApplyPromo = useCallback(() => {
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
  }, [promoCode, promoCodes, subtotal, items, addToast]);

  const removePromo = useCallback(() => {
    setPromoApplied(null);
    setPromoCode("");
  }, []);

  const clearPromoError = useCallback(() => setPromoError(""), []);

  return {
    promoCode,
    setPromoCode,
    promoApplied,
    promoError,
    clearPromoError,
    handleApplyPromo,
    removePromo,
  };
}
