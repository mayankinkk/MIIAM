import { describe, it, expect } from "vitest";
import {
  PASSPORT_PRESETS,
  PHOTO_SETS,
  checkCompliance,
  documentTypeLabel,
  getPhotoAspectRatio,
  getPresetById,
  mmToPixels,
  presetsByCountry,
} from "../passport-presets";

describe("PASSPORT_PRESETS", () => {
  it("has at least 5 presets", () => {
    expect(PASSPORT_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("every preset has positive dimensions", () => {
    for (const p of PASSPORT_PRESETS) {
      expect(p.widthMm).toBeGreaterThan(0);
      expect(p.heightMm).toBeGreaterThan(0);
    }
  });

  it("every preset has a country, type, and emoji", () => {
    for (const p of PASSPORT_PRESETS) {
      expect(p.country.length).toBeGreaterThan(0);
      expect(p.emoji.length).toBeGreaterThan(0);
      expect(["passport", "visa", "id_card", "driving_license"]).toContain(p.documentType);
    }
  });

  it("includes common India passport (35×35mm)", () => {
    const inP = PASSPORT_PRESETS.find((p) => p.countryCode === "IN" && p.documentType === "passport");
    expect(inP?.widthMm).toBe(35);
    expect(inP?.heightMm).toBe(35);
  });

  it("includes US passport (2×2in = 51×51mm)", () => {
    const us = PASSPORT_PRESETS.find((p) => p.countryCode === "US" && p.documentType === "passport");
    expect(us?.widthMm).toBe(51);
    expect(us?.heightMm).toBe(51);
  });
});

describe("PHOTO_SETS", () => {
  it("has 4/8/16/32 sets", () => {
    const counts = PHOTO_SETS.map((s) => s.count);
    expect(counts).toEqual([4, 8, 16, 32]);
  });

  it("prices increase with count", () => {
    for (let i = 1; i < PHOTO_SETS.length; i++) {
      expect(PHOTO_SETS[i].price).toBeGreaterThan(PHOTO_SETS[i - 1].price);
    }
  });

  it("marks 8 as popular", () => {
    expect(PHOTO_SETS.find((s) => s.count === 8)?.popular).toBe(true);
  });
});

describe("getPresetById", () => {
  it("returns the right preset", () => {
    expect(getPresetById("in_passport")?.country).toBe("India");
  });
  it("returns undefined for unknown", () => {
    expect(getPresetById("nope")).toBeUndefined();
  });
});

describe("presetsByCountry", () => {
  it("filters by country code", () => {
    const in_ = presetsByCountry("IN");
    expect(in_.length).toBeGreaterThan(0);
    for (const p of in_) {
      expect(p.countryCode).toBe("IN");
    }
  });
});

describe("getPhotoAspectRatio", () => {
  it("returns 1 for square photo", () => {
    expect(getPhotoAspectRatio({ widthMm: 35, heightMm: 35 } as never)).toBe(1);
  });

  it("returns ratio for rectangular photo", () => {
    expect(getPhotoAspectRatio({ widthMm: 35, heightMm: 45 } as never)).toBeCloseTo(35 / 45);
  });
});

describe("mmToPixels", () => {
  it("converts at 300 DPI", () => {
    expect(mmToPixels(25.4, 300)).toBe(300);
  });

  it("rounds to integer", () => {
    expect(Number.isInteger(mmToPixels(35, 300))).toBe(true);
  });
});

describe("documentTypeLabel", () => {
  it("returns labels for each type", () => {
    expect(documentTypeLabel("passport")).toBe("Passport");
    expect(documentTypeLabel("visa")).toBe("Visa");
    expect(documentTypeLabel("id_card")).toBe("ID Card");
    expect(documentTypeLabel("driving_license")).toBe("Driving Licence");
  });
});
