import { describe, it, expect } from "vitest";
import { normalizeGradientClass } from "./gradient-utils";

describe("normalizeGradientClass", () => {
  it("defaults empty gradients to brand green", () => {
    expect(normalizeGradientClass(null)).toBe("from-accent to-accent/70");
    expect(normalizeGradientClass("")).toBe("from-accent to-accent/70");
  });

  it("maps legacy blue gradients to MIIAM green", () => {
    expect(normalizeGradientClass("from-blue-500 to-indigo-500")).toBe("from-accent to-accent/70");
    expect(normalizeGradientClass("from-blue-400 to-indigo-400")).toBe("from-accent to-accent/70");
  });

  it("maps legacy purple gradients to deal orange", () => {
    expect(normalizeGradientClass("from-purple-500 to-pink-500")).toBe("from-deal to-deal/70");
    expect(normalizeGradientClass("from-violet-600 to-purple-400")).toBe("from-deal to-deal/70");
  });

  it("maps indigo-purple gradients to yellow-green", () => {
    expect(normalizeGradientClass("from-indigo-400 to-purple-400")).toBe("from-primary to-accent");
  });

  it("passes brand and unrelated gradients through unchanged", () => {
    expect(normalizeGradientClass("from-orange-500 to-red-500")).toBe("from-orange-500 to-red-500");
    expect(normalizeGradientClass("from-accent to-accent/70")).toBe("from-accent to-accent/70");
    expect(normalizeGradientClass("from-primary to-accent")).toBe("from-primary to-accent");
  });

  it("handles unknown blue combinations generically", () => {
    expect(normalizeGradientClass("from-blue-700 to-indigo-300")).toBe("from-accent to-accent/70");
  });
});
