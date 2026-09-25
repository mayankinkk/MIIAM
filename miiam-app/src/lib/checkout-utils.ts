const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Flat ₹15 service charge applied to every cart, regardless of item count */
export const FLAT_SERVICE_CHARGE = 15;

export function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

export function calculateOrderTotals({
  subtotal,
  tipAmount,
  serviceCharge,
  discount = 0,
}: {
  subtotal: number;
  tipAmount: number;
  serviceCharge?: number;
  discount?: number;
}) {
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const safeTip = Number.isFinite(tipAmount) ? Math.max(0, tipAmount) : 0;
  const safeDiscount = Number.isFinite(discount)
    ? Math.max(0, Math.min(discount, safeSubtotal))
    : 0;
  const totalDeliveryFee = 0;
  const totalServiceCharge = safeSubtotal > 0 ? (serviceCharge ?? FLAT_SERVICE_CHARGE) : 0;
  const gstAmount = 0;
  const packagingFee = 0;
  const platformFee = 0;
  const grand = Math.max(
    0,
    +(safeSubtotal - safeDiscount + totalServiceCharge + safeTip).toFixed(2)
  );
  return {
    discount: safeDiscount,
    totalDeliveryFee,
    totalServiceCharge,
    gstAmount,
    packagingFee,
    platformFee,
    grand,
  };
}
