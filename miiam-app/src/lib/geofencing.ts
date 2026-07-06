import { calculateDistance } from "@/lib/utils/haversine";
import logger from "@/lib/logger";

export interface DeliveryZone {
  id: string;
  vendor_id: string;
  name: string;
  type: "radius" | "polygon";
  radius_km: number | null;
  center_lat: number | null;
  center_lng: number | null;
  polygon_points: Array<{ lat: number; lng: number }> | null;
  delivery_fee: number;
  is_active: boolean;
}

export interface GeofenceResult {
  inZone: boolean;
  zone: DeliveryZone | null;
  distanceKm: number;
  deliveryFee: number;
  message: string;
}

const DEFAULT_MAX_DELIVERY_KM = 10;

export function checkDeliveryZone(params: {
  customerLat: number;
  customerLng: number;
  vendorLat: number;
  vendorLng: number;
  zones: DeliveryZone[];
  maxDistanceKm?: number;
  defaultDeliveryFee?: number;
}): GeofenceResult {
  const {
    customerLat,
    customerLng,
    vendorLat,
    vendorLng,
    zones,
    maxDistanceKm = DEFAULT_MAX_DELIVERY_KM,
    defaultDeliveryFee = 0,
  } = params;

  const distanceKm = calculateDistance(customerLat, customerLng, vendorLat, vendorLng);

  if (distanceKm > maxDistanceKm) {
    return {
      inZone: false,
      zone: null,
      distanceKm: +distanceKm.toFixed(1),
      deliveryFee: 0,
      message: `Delivery not available. Your location is ${distanceKm.toFixed(1)} km away (max ${maxDistanceKm} km).`,
    };
  }

  const activeZones = zones.filter(z => z.is_active);

  for (const zone of activeZones) {
    if (zone.type === "radius" && zone.center_lat && zone.center_lng && zone.radius_km) {
      const distToCenter = calculateDistance(customerLat, customerLng, zone.center_lat, zone.center_lng);
      if (distToCenter <= zone.radius_km) {
        return {
          inZone: true,
          zone,
          distanceKm: +distanceKm.toFixed(1),
          deliveryFee: zone.delivery_fee,
          message: "",
        };
      }
    }

    if (zone.type === "polygon" && zone.polygon_points && zone.polygon_points.length >= 3) {
      if (isPointInPolygon(customerLat, customerLng, zone.polygon_points)) {
        return {
          inZone: true,
          zone,
          distanceKm: +distanceKm.toFixed(1),
          deliveryFee: zone.delivery_fee,
          message: "",
        };
      }
    }
  }

  if (activeZones.length === 0 && distanceKm <= maxDistanceKm) {
    return {
      inZone: true,
      zone: null,
      distanceKm: +distanceKm.toFixed(1),
      deliveryFee: defaultDeliveryFee,
      message: "",
    };
  }

  return {
    inZone: false,
    zone: null,
    distanceKm: +distanceKm.toFixed(1),
    deliveryFee: 0,
    message: "Your location is outside all delivery zones.",
  };
}

function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<{ lat: number; lng: number }>,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function getVendorDeliveryZones(
  vendorId: string,
  supabase: { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { then: (resolve: (result: { data: DeliveryZone[] | null }) => void) => void } } } },
): Promise<DeliveryZone[]> {
  try {
    const result = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("vendor_id", vendorId);
    return result.data || [];
  } catch (err) {
    logger.error({ err }, "Failed to get delivery zones");
    return [];
  }
}
