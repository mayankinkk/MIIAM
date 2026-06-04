import { describe, it, expect } from "vitest";
import { QUALITY_MULTIPLIER } from "../store/printSettingsStore";

describe("QUALITY_MULTIPLIER", () => {
  it("draft is cheaper than normal", () => {
    expect(QUALITY_MULTIPLIER.draft).toBeLessThan(QUALITY_MULTIPLIER.normal);
  });

  it("high is more expensive than normal", () => {
    expect(QUALITY_MULTIPLIER.high).toBeGreaterThan(QUALITY_MULTIPLIER.normal);
  });

  it("normal is 1.0", () => {
    expect(QUALITY_MULTIPLIER.normal).toBe(1);
  });

  it("draft is 0.8 (20% off)", () => {
    expect(QUALITY_MULTIPLIER.draft).toBe(0.8);
  });

  it("high is 1.3 (30% surcharge)", () => {
    expect(QUALITY_MULTIPLIER.high).toBe(1.3);
  });
});
