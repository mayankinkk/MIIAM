import { describe, it, expect } from "vitest";
import {
  ADDON_CATALOG,
  DEFAULT_ADDON_PRICING,
  calculateAddOnCost,
  getAddOnDescriptor,
  rushEtaMinutes,
  rushLabel,
  rushMultiplier,
} from "../printing-addons";

const pricing = DEFAULT_ADDON_PRICING;

describe("calculateAddOnCost", () => {
  const ctx = { totalPages: 10, copies: 2 };

  it("cover page is per-copy", () => {
    const cost = calculateAddOnCost("cover_page", pricing, ctx);
    expect(cost).toBe(pricing.coverPage * ctx.copies);
  });

  it("collate is per-page", () => {
    const cost = calculateAddOnCost("collate_interleaved", pricing, ctx);
    expect(cost).toBe(pricing.collatePerPage * ctx.totalPages);
  });

  it("binding is per-copy", () => {
    expect(calculateAddOnCost("binding_spiral", pricing, ctx)).toBe(pricing.bindingSpiral * ctx.copies);
    expect(calculateAddOnCost("binding_soft", pricing, ctx)).toBe(pricing.bindingSoft * ctx.copies);
    expect(calculateAddOnCost("binding_hard", pricing, ctx)).toBe(pricing.bindingHard * ctx.copies);
  });

  it("hole-punch and fold are per-set (per-copy)", () => {
    expect(calculateAddOnCost("hole_punch_2", pricing, ctx)).toBe(pricing.holePunch2 * ctx.copies);
    expect(calculateAddOnCost("hole_punch_3", pricing, ctx)).toBe(pricing.holePunch3 * ctx.copies);
    expect(calculateAddOnCost("hole_punch_4", pricing, ctx)).toBe(pricing.holePunch4 * ctx.copies);
    expect(calculateAddOnCost("fold_bi", pricing, ctx)).toBe(pricing.foldBi * ctx.copies);
    expect(calculateAddOnCost("fold_tri", pricing, ctx)).toBe(pricing.foldTri * ctx.copies);
  });

  it("lamination_a4 is per-page", () => {
    expect(calculateAddOnCost("lamination_a4", pricing, ctx)).toBe(pricing.laminationA4 * ctx.totalPages);
  });

  it("lamination_id is per-copy", () => {
    expect(calculateAddOnCost("lamination_id", pricing, ctx)).toBe(pricing.laminationId * ctx.copies);
  });

  it("returns 0 for unknown id", () => {
    expect(calculateAddOnCost("nonexistent" as never, pricing, ctx)).toBe(0);
  });
});

describe("rushMultiplier", () => {
  it("standard tier is 1.0", () => {
    expect(rushMultiplier("standard", pricing)).toBe(1);
  });

  it("rush_30 uses rush30Multiplier", () => {
    expect(rushMultiplier("rush_30", pricing)).toBe(pricing.rush30Multiplier);
  });

  it("rush_15 uses rush15Multiplier", () => {
    expect(rushMultiplier("rush_15", pricing)).toBe(pricing.rush15Multiplier);
  });

  it("rush_15 costs more than rush_30", () => {
    expect(rushMultiplier("rush_15", pricing)).toBeGreaterThan(rushMultiplier("rush_30", pricing));
  });
});

describe("rushEtaMinutes", () => {
  it("returns the correct ETA per tier", () => {
    expect(rushEtaMinutes("standard")).toBe(60);
    expect(rushEtaMinutes("rush_30")).toBe(30);
    expect(rushEtaMinutes("rush_15")).toBe(15);
  });
});

describe("rushLabel", () => {
  it("returns human label per tier", () => {
    expect(rushLabel("standard")).toBe("Standard");
    expect(rushLabel("rush_30")).toBe("Rush 30-min");
    expect(rushLabel("rush_15")).toBe("Rush 15-min");
  });
});

describe("ADDON_CATALOG", () => {
  it("has at least one option per category", () => {
    const categories = new Set(ADDON_CATALOG.map((a) => a.category));
    expect(categories.has("finishing")).toBe(true);
    expect(categories.has("binding")).toBe(true);
    expect(categories.has("lamination")).toBe(true);
    expect(categories.has("presentation")).toBe(true);
  });

  it("every entry has a valid pricing key", () => {
    for (const entry of ADDON_CATALOG) {
      expect(pricing).toHaveProperty(entry.pricingKey);
    }
  });
});

describe("getAddOnDescriptor", () => {
  it("returns descriptor for known id", () => {
    const desc = getAddOnDescriptor("binding_spiral");
    expect(desc?.id).toBe("binding_spiral");
  });

  it("returns undefined for unknown id", () => {
    expect(getAddOnDescriptor("nope" as never)).toBeUndefined();
  });
});
