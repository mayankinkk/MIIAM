import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./checkout-utils";

describe("calculateOrderTotals", () => {
  it("calculates subtotal + service charge", () => {
    const result = calculateOrderTotals({
      subtotal: 500,
      promoApplied: null,
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.discount).toBe(0);
    expect(result.totalDeliveryFee).toBe(0);
    expect(result.grand).toBe(515); // 500 + 15
  });

  it("applies percent promo discount", () => {
    const result = calculateOrderTotals({
      subtotal: 1000,
      promoApplied: { code: "SAVE10", discount: 100, type: "percent" },
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.discount).toBe(100);
    expect(result.grand).toBe(915); // 1000 - 100 + 15
  });

  it("applies flat promo discount", () => {
    const result = calculateOrderTotals({
      subtotal: 800,
      promoApplied: { code: "FLAT50", discount: 50, type: "flat" },
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.discount).toBe(50);
    expect(result.grand).toBe(765); // 800 - 50 + 15
  });

  it("adds tip amount to grand total", () => {
    const result = calculateOrderTotals({
      subtotal: 400,
      promoApplied: null,
      tipAmount: 50,
      serviceCharge: 15,
    });

    expect(result.grand).toBe(465); // 400 + 15 + 50
  });

  it("returns grand total of 0 when subtotal is 0", () => {
    const result = calculateOrderTotals({
      subtotal: 0,
      promoApplied: null,
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
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.grand).toBe(0);
  });

  it("delivery and other fees are always free", () => {
    const result = calculateOrderTotals({
      subtotal: 300,
      promoApplied: null,
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.totalDeliveryFee).toBe(0);
    expect(result.gstAmount).toBe(0);
    expect(result.packagingFee).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.grand).toBe(315); // 300 + 15
  });
});
