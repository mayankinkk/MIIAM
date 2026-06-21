import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./checkout-utils";

describe("calculateOrderTotals", () => {
  it("calculates basic subtotal + delivery + service charge", () => {
    const result = calculateOrderTotals({
      subtotal: 500,
      promoApplied: null,
      serviceVendorIds: ["v1"],
      tipAmount: 0,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 40 },
    });

    expect(result.discount).toBe(0);
    expect(result.totalDeliveryFee).toBe(40);
    expect(result.grand).toBe(548); // 500 - 0 + 40 + (1 * 8) + 0
  });

  it("applies percent promo discount", () => {
    const result = calculateOrderTotals({
      subtotal: 1000,
      promoApplied: { code: "SAVE10", discount: 100, type: "percent" },
      serviceVendorIds: ["v1"],
      tipAmount: 0,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 30 },
    });

    expect(result.discount).toBe(100);
    expect(result.grand).toBe(938); // 1000 - 100 + 30 + 8 + 0
  });

  it("applies flat promo discount", () => {
    const result = calculateOrderTotals({
      subtotal: 800,
      promoApplied: { code: "FLAT50", discount: 50, type: "flat" },
      serviceVendorIds: ["v1"],
      tipAmount: 0,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 20 },
    });

    expect(result.discount).toBe(50);
    expect(result.grand).toBe(778); // 800 - 50 + 20 + 8 + 0
  });

  it("adds tip amount to grand total", () => {
    const result = calculateOrderTotals({
      subtotal: 400,
      promoApplied: null,
      serviceVendorIds: ["v1"],
      tipAmount: 50,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 25 },
    });

    expect(result.grand).toBe(483); // 400 + 25 + 8 + 50
  });

  it("returns grand total of 0 when subtotal is 0", () => {
    const result = calculateOrderTotals({
      subtotal: 0,
      promoApplied: null,
      serviceVendorIds: [],
      tipAmount: 0,
      serviceCharge: 0,
    });

    expect(result.discount).toBe(0);
    expect(result.totalDeliveryFee).toBe(0);
    expect(result.grand).toBe(0);
  });

  it("clamps grand total to 0 when discount exceeds subtotal", () => {
    const result = calculateOrderTotals({
      subtotal: 100,
      promoApplied: { code: "BIG", discount: 200, type: "flat" },
      serviceVendorIds: [],
      tipAmount: 0,
      serviceCharge: 0,
    });

    expect(result.grand).toBe(0);
  });

  it("sums delivery charges across multiple vendors", () => {
    const result = calculateOrderTotals({
      subtotal: 1200,
      promoApplied: null,
      serviceVendorIds: ["v1", "v2", "v3"],
      tipAmount: 30,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 40, v2: 25, v3: 35 },
    });

    expect(result.totalDeliveryFee).toBe(100); // 40 + 25 + 35
    expect(result.grand).toBe(1354); // 1200 + 100 + (3 * 8) + 30
  });

  it("defaults delivery to 0 for missing vendor charges", () => {
    const result = calculateOrderTotals({
      subtotal: 300,
      promoApplied: null,
      serviceVendorIds: ["v1", "v2"],
      tipAmount: 0,
      serviceCharge: 8,
      vendorDeliveryCharges: { v1: 30 },
    });

    expect(result.totalDeliveryFee).toBe(30); // v2 has no entry, defaults 0
    expect(result.grand).toBe(346); // 300 + 30 + (2 * 8) + 0
  });
});
