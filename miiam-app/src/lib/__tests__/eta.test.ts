import { describe, it, expect } from "vitest";
import { calculateEta, isPeakHour } from "@/lib/eta";

describe("calculateEta", () => {
  it("returns an EtaEstimate with positive values", () => {
    const result = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6200,
      vendorLng: 77.2150,
    });

    expect(result.distanceKm).toBeGreaterThanOrEqual(0);
    expect(result.estimatedMinutes).toBeGreaterThanOrEqual(15);
    expect(result.estimatedMinutes).toBeLessThanOrEqual(120);
    expect(result.breakdown.preparationMinutes).toBeGreaterThan(0);
    expect(result.breakdown.pickupMinutes).toBeGreaterThan(0);
    expect(result.breakdown.deliveryMinutes).toBeGreaterThanOrEqual(0);
    expect(result.displayText).toBeTruthy();
  });

  it("returns higher ETA for farther distances", () => {
    const near = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6140,
      vendorLng: 77.2091,
    });

    const far = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.7000,
      vendorLng: 77.3000,
    });

    expect(far.estimatedMinutes).toBeGreaterThanOrEqual(near.estimatedMinutes);
    expect(far.distanceKm).toBeGreaterThan(near.distanceKm);
  });

  it("applies peak hour multiplier", () => {
    const base = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6200,
      vendorLng: 77.2150,
      isPeakHour: false,
    });

    const peak = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6200,
      vendorLng: 77.2150,
      isPeakHour: true,
    });

    expect(peak.estimatedMinutes).toBeGreaterThanOrEqual(base.estimatedMinutes);
  });

  it("accounts for order item count", () => {
    const small = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6200,
      vendorLng: 77.2150,
      orderItemCount: 1,
    });

    const large = calculateEta({
      customerLat: 28.6139,
      customerLng: 77.2090,
      vendorLat: 28.6200,
      vendorLng: 77.2150,
      orderItemCount: 10,
    });

    expect(large.breakdown.preparationMinutes).toBeGreaterThanOrEqual(small.breakdown.preparationMinutes);
  });
});

describe("isPeakHour", () => {
  it("returns a boolean", () => {
    expect(typeof isPeakHour()).toBe("boolean");
  });
});
