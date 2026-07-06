import { describe, it, expect } from "vitest";
import { calculateDistance } from "@/lib/utils/haversine";

describe("calculateDistance", () => {
  it("returns 0 for same point", () => {
    expect(calculateDistance(28.6139, 77.209, 28.6139, 77.209)).toBe(0);
  });

  it("calculates distance between two known points", () => {
    // Delhi to Mumbai ~1150 km
    const dist = calculateDistance(28.6139, 77.209, 19.076, 72.8777);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1400);
  });

  it("is symmetric", () => {
    const d1 = calculateDistance(28.6, 77.2, 19.0, 72.8);
    const d2 = calculateDistance(19.0, 72.8, 28.6, 77.2);
    expect(d1).toBeCloseTo(d2, 1);
  });
});
