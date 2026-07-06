import { describe, it, expect } from "vitest";
import { checkDeliveryZone } from "@/lib/geofencing";

describe("checkDeliveryZone", () => {
  it("returns inZone=true when no zones and within max distance", () => {
    const result = checkDeliveryZone({
      customerLat: 28.614,
      customerLng: 77.209,
      vendorLat: 28.6139,
      vendorLng: 77.209,
      zones: [],
      maxDistanceKm: 10,
    });
    expect(result.inZone).toBe(true);
    expect(result.distanceKm).toBeCloseTo(0, 0);
  });

  it("returns inZone=false when beyond max distance", () => {
    const result = checkDeliveryZone({
      customerLat: 30.0,
      customerLng: 80.0,
      vendorLat: 28.6139,
      vendorLng: 77.209,
      zones: [],
      maxDistanceKm: 5,
    });
    expect(result.inZone).toBe(false);
  });

  it("returns inZone=true for point inside radius zone", () => {
    const result = checkDeliveryZone({
      customerLat: 28.614,
      customerLng: 77.209,
      vendorLat: 28.6139,
      vendorLng: 77.209,
      zones: [
        {
          id: "1",
          vendor_id: "v1",
          name: "Nearby",
          type: "radius",
          radius_km: 5,
          center_lat: 28.6139,
          center_lng: 77.209,
          polygon_points: null,
          delivery_fee: 30,
          is_active: true,
        },
      ],
    });
    expect(result.inZone).toBe(true);
    expect(result.deliveryFee).toBe(30);
  });

  it("returns inZone=false for point outside radius zone", () => {
    const result = checkDeliveryZone({
      customerLat: 30.0,
      customerLng: 80.0,
      vendorLat: 28.6139,
      vendorLng: 77.209,
      zones: [
        {
          id: "1",
          vendor_id: "v1",
          name: "Nearby",
          type: "radius",
          radius_km: 2,
          center_lat: 28.6139,
          center_lng: 77.209,
          polygon_points: null,
          delivery_fee: 30,
          is_active: true,
        },
      ],
    });
    expect(result.inZone).toBe(false);
  });

  it("ignores inactive zones", () => {
    const result = checkDeliveryZone({
      customerLat: 28.614,
      customerLng: 77.209,
      vendorLat: 28.6139,
      vendorLng: 77.209,
      zones: [
        {
          id: "1",
          vendor_id: "v1",
          name: "Zone",
          type: "radius",
          radius_km: 1,
          center_lat: 30.0,
          center_lng: 80.0,
          polygon_points: null,
          delivery_fee: 30,
          is_active: false,
        },
      ],
      maxDistanceKm: 10,
    });
    expect(result.inZone).toBe(true);
  });
});
