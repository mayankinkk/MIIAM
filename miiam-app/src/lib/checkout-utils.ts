const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

export function calculateOrderTotals({
  subtotal,
  tipAmount,
  serviceCharge,
}: {
  subtotal: number;
  tipAmount: number;
  serviceCharge: number;
}) {
  const discount = 0;
  const totalDeliveryFee = 0;
  const totalServiceCharge = serviceCharge;
  const gstAmount = 0;
  const packagingFee = 0;
  const platformFee = 0;
  const grand = Math.max(0, +(subtotal + totalServiceCharge + tipAmount).toFixed(2));
  return { discount, totalDeliveryFee, totalServiceCharge, gstAmount, packagingFee, platformFee, grand };
}
