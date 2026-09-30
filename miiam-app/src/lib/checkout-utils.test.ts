import { describe, it, expect } from "vitest";
import { calculateOrderTotals, normalizePhone, isValidPhone, buildScheduledIso, isUuid } from "./checkout-utils";

describe("normalizePhone", () => {
  it("converts a 10-digit Indian mobile to E.164", () => {
    expect(normalizePhone("9876543210")).toBe("+919876543210");
  });

  it("strips separators and a leading 91", () => {
    expect(normalizePhone("91 98765-43210")).toBe("+919876543210");
  });

  it("strips a leading trunk zero", () => {
    expect(normalizePhone("09876543210")).toBe("+919876543210");
  });

  it("keeps an already-canonical +91 number", () => {
    expect(normalizePhone("+919876543210")).toBe("+919876543210");
  });

  it("keeps other valid international numbers", () => {
    expect(normalizePhone("+14155552671")).toBe("+14155552671");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("12345")).toBe("");
    expect(normalizePhone("1234567890")).toBe("");
    expect(normalizePhone("abcdefghij")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("accepts usable numbers and rejects unusable ones", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("+91 98765 43210")).toBe(true);
    expect(isValidPhone("09876543210")).toBe(true);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("12345")).toBe(false);
  });
});

describe("buildScheduledIso", () => {
  it("combines a date and a 12-hour slot", () => {
    expect(buildScheduledIso("2026-10-05", "07:30 PM - 08:00 PM")).toBe(
      new Date("2026-10-05T19:30:00").toISOString()
    );
  });

  it("handles the midnight hour of an AM slot", () => {
    expect(buildScheduledIso("2026-10-05", "12:00 AM - 12:30 AM")).toBe(
      new Date("2026-10-05T00:00:00").toISOString()
    );
  });

  it("returns null when inputs are missing or malformed", () => {
    expect(buildScheduledIso("", "07:30 PM - 08:00 PM")).toBeNull();
    expect(buildScheduledIso("2026-10-05", "")).toBeNull();
    expect(buildScheduledIso("not-a-date", "07:30 PM - 08:00 PM")).toBeNull();
  });
});

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

describe("isUuid", () => {
  it("accepts real uuids and rejects cart ids that are not menu_items rows", () => {
    expect(isUuid("ccc2aa64-268d-47d6-aad7-c6a7dd076125")).toBe(true);
    expect(isUuid("combo-3ff244f5-4196-4411-9f37-33cbe961de87")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("store")).toBe(false);
  });
});
