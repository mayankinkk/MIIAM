import { PRINT_MENU_ITEM_ID } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : PRINT_MENU_ITEM_ID;
}

export interface PromoCode {
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

export function calculateOrderTotals({
  subtotal,
  promoApplied,
  serviceVendorIds,
  tipAmount,
  serviceCharge,
}: {
  subtotal: number;
  promoApplied: { code: string; discount: number; type: "percent" | "flat" } | null;
  serviceVendorIds: string[];
  tipAmount: number;
  serviceCharge: number;
}) {
  const discount = promoApplied
    ? promoApplied.type === "percent"
      ? +(subtotal * (promoApplied.discount / 100)).toFixed(2)
      : promoApplied.discount
    : 0;
  const totalDeliveryFee = 0;
  const grand = Math.max(0, +(subtotal - discount + totalDeliveryFee + (serviceVendorIds.length * serviceCharge) + tipAmount).toFixed(2));
  return { discount, totalDeliveryFee, grand };
}
