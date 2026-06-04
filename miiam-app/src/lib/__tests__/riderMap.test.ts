import { describe, it, expect } from "vitest";

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}
function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
function bearing(a: [number, number], b: [number, number]) {
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

describe("rider animation maths", () => {
  it("haversine returns zero for identical points", () => {
    expect(haversine([28.61, 77.21], [28.61, 77.21])).toBeCloseTo(0, 5);
  });

  it("haversine computes approximate distance between two cities", () => {
    // New Delhi -> Mumbai ~ 1145 km
    const d = haversine([28.6139, 77.209], [19.076, 72.8777]);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1200);
  });

  it("bearing is 0 when moving north", () => {
    // Moving from origin due north
    const b = bearing([0, 0], [1, 0]);
    expect(b).toBeCloseTo(0, 1);
  });

  it("bearing is 90 when moving east", () => {
    const b = bearing([0, 0], [0, 1]);
    expect(b).toBeCloseTo(90, 1);
  });

  it("bearing is 180 when moving south", () => {
    const b = bearing([0, 0], [-1, 0]);
    expect(b).toBeCloseTo(180, 1);
  });

  it("bearing is 270 when moving west", () => {
    const b = bearing([0, 0], [0, -1]);
    expect(b).toBeCloseTo(270, 1);
  });

  it("easeInOutQuad starts and ends at 0/1", () => {
    expect(easeInOutQuad(0)).toBe(0);
    expect(easeInOutQuad(1)).toBe(1);
  });

  it("easeInOutQuad reaches 0.5 at midpoint", () => {
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 5);
  });

  it("easeInOutQuad is monotonically non-decreasing on [0,1]", () => {
    let prev = easeInOutQuad(0);
    for (let t = 0.05; t <= 1.0; t += 0.05) {
      const v = easeInOutQuad(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
