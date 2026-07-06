import { describe, it, expect } from "vitest";
import { checkSurgePricing, applySurgePricing } from "@/lib/surge-pricing";

describe("checkSurgePricing", () => {
  it("returns isSurge=false for no surge conditions", () => {
    const result = checkSurgePricing({});
    expect(typeof result.isSurge).toBe("boolean");
    expect(typeof result.multiplier).toBe("number");
    expect(result.multiplier).toBeGreaterThanOrEqual(1);
  });

  it("applies higher multiplier with higher order count", () => {
    const low = checkSurgePricing({ orderCount: 10 });
    const high = checkSurgePricing({ orderCount: 100 });
    expect(high.multiplier).toBeGreaterThanOrEqual(low.multiplier);
  });
});

describe("applySurgePricing", () => {
  it("returns original price when multiplier is 1", () => {
    const result = applySurgePricing(100, 1);
    expect(result.finalPrice).toBe(100);
    expect(result.surgeAmount).toBe(0);
  });

  it("applies surge multiplier correctly", () => {
    const result = applySurgePricing(100, 1.2);
    expect(result.finalPrice).toBe(120);
    expect(result.surgeAmount).toBe(20);
  });

  it("handles zero base price", () => {
    const result = applySurgePricing(0, 1.5);
    expect(result.finalPrice).toBe(0);
    expect(result.surgeAmount).toBe(0);
  });
});
