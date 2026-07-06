import { describe, it, expect } from "vitest";
import { isVendorOpen, parseOpeningHours, getVendorCurrentStatus } from "@/lib/vendor-hours";

describe("parseOpeningHours", () => {
  it("returns null for null input", () => {
    expect(parseOpeningHours(null)).toBeNull();
  });

  it("parses valid JSON", () => {
    const hours = JSON.stringify({
      monday: { open: "09:00", close: "22:00", is_closed: false },
      tuesday: { open: "10:00", close: "21:00", is_closed: false },
    });
    const result = parseOpeningHours(hours);
    expect(result).not.toBeNull();
    expect(result?.monday.open).toBe("09:00");
    expect(result?.monday.close).toBe("22:00");
  });

  it("returns defaults for invalid JSON", () => {
    const result = parseOpeningHours("not-json");
    expect(result).toBeNull();
  });
});

describe("isVendorOpen", () => {
  it("returns open=true for null hours", () => {
    expect(isVendorOpen(null)).toEqual({ open: true });
  });
});

describe("getVendorCurrentStatus", () => {
  it("returns temporarily unavailable for inactive vendor", () => {
    const result = getVendorCurrentStatus({
      vendor_id: "1",
      shop_name: "Test",
      opening_hours: null,
      is_active: false,
    });
    expect(result.isOpen).toBe(false);
    expect(result.statusText).toBe("Temporarily unavailable");
  });
});
