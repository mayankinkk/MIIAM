/**
 * Orders placed without an account are tracked on the device that placed
 * them: we remember { order id, phone } and read them back through
 * /api/orders/guest (id + phone are the credential).
 */

export interface GuestOrderRef {
  id: string;
  phone: string;
  placed_at: string;
}

const STORAGE_KEY = "miiam_guest_orders";
const MAX_REFS = 50;

function isRef(value: unknown): value is GuestOrderRef {
  if (!value || typeof value !== "object") return false;
  const ref = value as Partial<GuestOrderRef>;
  return typeof ref.id === "string" && typeof ref.phone === "string" && ref.phone.length > 0;
}

export function readGuestOrders(): GuestOrderRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRef);
  } catch {
    return [];
  }
}

export function rememberGuestOrder(id: string, phone: string): void {
  if (typeof window === "undefined" || !id || !phone) return;
  try {
    const existing = readGuestOrders().filter((ref) => ref.id !== id);
    const next = [{ id, phone, placed_at: new Date().toISOString() }, ...existing].slice(0, MAX_REFS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full / private mode — tracking on this device is best-effort
  }
}

export function getGuestOrder(id: string): GuestOrderRef | null {
  return readGuestOrders().find((ref) => ref.id === id) ?? null;
}

export function guestOrderRefs(): Array<{ id: string; phone: string }> {
  return readGuestOrders().map((ref) => ({ id: ref.id, phone: ref.phone }));
}

/** Fetch this device's guest orders from the server. */
export async function fetchGuestOrders(
  refs: Array<{ id: string; phone: string }>
): Promise<Record<string, unknown>[]> {
  if (refs.length === 0) return [];
  const res = await fetch(`/api/orders/guest?refs=${encodeURIComponent(JSON.stringify(refs))}`);
  if (!res.ok) throw new Error(`Guest orders lookup failed (${res.status})`);
  const data = (await res.json()) as { orders?: Record<string, unknown>[] };
  return data.orders ?? [];
}
