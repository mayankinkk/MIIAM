import { describe, it, expect, vi, afterEach } from "vitest";
import { getCurrentMenuSlot } from "./menuSlots";

describe("getCurrentMenuSlot", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns breakfast for morning hours (6-11)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 8, 0, 0));
    expect(getCurrentMenuSlot()).toBe("breakfast");
  });

  it("returns breakfast at hour 6 (start boundary)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 6, 0, 0));
    expect(getCurrentMenuSlot()).toBe("breakfast");
  });

  it("returns lunch for afternoon hours (11-16)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 13, 0, 0));
    expect(getCurrentMenuSlot()).toBe("lunch");
  });

  it("returns lunch at hour 11 (start boundary)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 11, 0, 0));
    expect(getCurrentMenuSlot()).toBe("lunch");
  });

  it("returns dinner for evening hours (16-23)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 19, 0, 0));
    expect(getCurrentMenuSlot()).toBe("dinner");
  });

  it("returns dinner at hour 16 (start boundary)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 16, 0, 0));
    expect(getCurrentMenuSlot()).toBe("dinner");
  });

  it("returns all_day for night hours (23-5)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 2, 0, 0));
    expect(getCurrentMenuSlot()).toBe("all_day");
  });

  it("returns all_day at hour 23", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 23, 0, 0));
    expect(getCurrentMenuSlot()).toBe("all_day");
  });

  it("returns all_day at hour 5", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 5, 0, 0));
    expect(getCurrentMenuSlot()).toBe("all_day");
  });
});
