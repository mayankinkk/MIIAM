const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Flat ₹15 service charge applied to every cart, regardless of item count */
export const FLAT_SERVICE_CHARGE = 15;

export function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

export function calculateOrderTotals({
  subtotal,
  tipAmount,
}: {
  subtotal: number;
  tipAmount: number;
  serviceCharge?: number; // kept for API compat but ignored — use FLAT_SERVICE_CHARGE
}) {
  const discount = 0;
  const totalDeliveryFee = 0;
  const totalServiceCharge = subtotal > 0 ? FLAT_SERVICE_CHARGE : 0;
  const gstAmount = 0;
  const packagingFee = 0;
  const platformFee = 0;
  const grand = Math.max(0, +(subtotal + totalServiceCharge + tipAmount).toFixed(2));
  return { discount, totalDeliveryFee, totalServiceCharge, gstAmount, packagingFee, platformFee, grand };
}
