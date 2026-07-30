import { describe, it, expect } from "vitest";
import { calculateOrderTotals } from "./checkout-utils";

describe("calculateOrderTotals", () => {
  it("calculates subtotal + service charge", () => {
    const result = calculateOrderTotals({
      subtotal: 500,
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.discount).toBe(0);
    expect(result.totalDeliveryFee).toBe(0);
    expect(result.grand).toBe(515);
  });

  it("adds tip amount to grand total", () => {
    const result = calculateOrderTotals({
      subtotal: 400,
      tipAmount: 50,
      serviceCharge: 15,
    });

    expect(result.grand).toBe(465);
  });

  it("returns grand total of 0 when subtotal is 0", () => {
    const result = calculateOrderTotals({
      subtotal: 0,
      tipAmount: 0,
      serviceCharge: 0,
    });

    expect(result.discount).toBe(0);
    expect(result.totalDeliveryFee).toBe(0);
    expect(result.grand).toBe(0);
  });

  it("delivery and other fees are always free", () => {
    const result = calculateOrderTotals({
      subtotal: 300,
      tipAmount: 0,
      serviceCharge: 15,
    });

    expect(result.totalDeliveryFee).toBe(0);
    expect(result.gstAmount).toBe(0);
    expect(result.packagingFee).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.grand).toBe(315);
  });
});
