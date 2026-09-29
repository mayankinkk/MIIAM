const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Flat ₹15 service charge applied to every cart, regardless of item count */
export const FLAT_SERVICE_CHARGE = 15;

export function safeMenuItemId(id: string) {
  return UUID_RE.test(id) ? id : crypto.randomUUID();
}

/**
 * Canonicalise a phone number to E.164 (`+91XXXXXXXXXX` for Indian mobiles).
 * Returns an empty string when the number is not usable.
 */
export function normalizePhone(raw: string): string {
  const trimmed = (raw || "").replace(/[\s\-().]/g, "");
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits && /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : "";
  }

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : "";
  }

  return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : "";
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw).length > 0;
}

/**
 * Combine `YYYY-MM-DD` with a `hh:mm AM - hh:mm AM` slot into an ISO string.
 * Mirrors the parsing the checkout has always done client-side.
 */
export function buildScheduledIso(scheduledDate: string, scheduledTime: string): string | null {
  if (!scheduledDate || !scheduledTime) return null;
  try {
    const timePart = scheduledTime.split(" - ")[0].trim();
    const [time, period] = timePart.split(/\s+/);
    const [hours, minutes] = time.split(":").map(Number);
    let h = hours;
    if (period?.toUpperCase() === "PM" && h < 12) h += 12;
    if (period?.toUpperCase() === "AM" && h === 12) h = 0;
    const iso = new Date(
      `${scheduledDate}T${String(h).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`
    ).toISOString();
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  } catch {
    return null;
  }
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
