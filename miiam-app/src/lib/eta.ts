import { calculateDistance } from "@/lib/utils/haversine";
import logger from "@/lib/logger";

export interface EtaEstimate {
  distanceKm: number;
  estimatedMinutes: number;
  breakdown: {
    preparationMinutes: number;
    pickupMinutes: number;
    deliveryMinutes: number;
  };
  displayText: string;
}

const DEFAULT_PREP_TIME = 15;
const DEFAULT_PICKUP_TIME = 5;
const AVG_SPEED_KMH = 20;
const RESTAURANT_BUFFER = 5;

export function calculateEta(params: {
  customerLat: number;
  customerLng: number;
  vendorLat: number;
  vendorLng: number;
  estimatedPrepTime?: number | null;
  orderItemCount?: number;
  isPeakHour?: boolean;
}): EtaEstimate {
  const {
    customerLat,
    customerLng,
    vendorLat,
    vendorLng,
    estimatedPrepTime,
    orderItemCount = 1,
    isPeakHour = false,
  } = params;

  const distanceKm = calculateDistance(customerLat, customerLng, vendorLat, vendorLng);

  const prepTime = estimatedPrepTime || DEFAULT_PREP_TIME + Math.min(orderItemCount * 2, 15);
  const pickupTime = DEFAULT_PICKUP_TIME;
  const deliveryTime = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);

  const buffer = isPeakHour ? RESTAURANT_BUFFER * 2 : RESTAURANT_BUFFER;
  const totalMinutes = prepTime + pickupTime + deliveryTime + buffer;

  const clampedMinutes = Math.max(15, Math.min(totalMinutes, 120));

  let displayText: string;
  if (clampedMinutes <= 30) {
    displayText = `${clampedMinutes}–${clampedMinutes + 10} min`;
  } else if (clampedMinutes <= 60) {
    displayText = `${Math.floor(clampedMinutes / 10) * 10}–${Math.ceil(clampedMinutes / 10) * 10} min`;
  } else {
    const hours = Math.floor(clampedMinutes / 60);
    const mins = clampedMinutes % 60;
    displayText = mins > 15 ? `${hours + 1} hr` : `${hours} hr ${mins} min`;
  }

  return {
    distanceKm: +distanceKm.toFixed(1),
    estimatedMinutes: clampedMinutes,
    breakdown: {
      preparationMinutes: prepTime,
      pickupMinutes: pickupTime,
      deliveryMinutes: deliveryTime,
    },
    displayText,
  };
}

export async function getVendorCoordinates(
  vendorId: string,
  supabase: { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { lat: number; lng: number } | null }> } } } },
): Promise<{ lat: number; lng: number } | null> {
  try {
    const { data } = await supabase
      .from("vendors")
      .select("lat, lng")
      .eq("id", vendorId)
      .maybeSingle();
    if (data && data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng };
    }
    return null;
  } catch (err) {
    logger.error({ err }, "Failed to get vendor coordinates");
    return null;
  }
}

export function isPeakHour(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = ist.getHours();
  return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
}
