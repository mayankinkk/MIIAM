import { describe, it, expect } from "vitest";
import { isServiceOpen, timeToMinutes, formatTime12h } from "../store/serviceSettingsStore";

describe("isServiceOpen", () => {
  it("returns true during open hours for a normal day", () => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    expect(isServiceOpen({ open: "09:00", close: "18:00", is24x7: false }, now)).toBe(true);
  });

  it("returns false before open hours", () => {
    const now = new Date();
    now.setHours(7, 0, 0, 0);
    expect(isServiceOpen({ open: "09:00", close: "18:00", is24x7: false }, now)).toBe(false);
  });

  it("returns false at exact close time (end-exclusive)", () => {
    const now = new Date();
    now.setHours(18, 0, 0, 0);
    expect(isServiceOpen({ open: "09:00", close: "18:00", is24x7: false }, now)).toBe(false);
  });

  it("returns true at one minute before close", () => {
    const now = new Date();
    now.setHours(17, 59, 0, 0);
    expect(isServiceOpen({ open: "09:00", close: "18:00", is24x7: false }, now)).toBe(true);
  });

  it("returns true for 24x7 service at midnight", () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expect(isServiceOpen({ open: "00:00", close: "23:59", is24x7: true }, now)).toBe(true);
  });

  it("handles cross-midnight hours (e.g. 22:00 - 02:00)", () => {
    const beforeMidnight = new Date();
    beforeMidnight.setHours(23, 30, 0, 0);
    expect(isServiceOpen({ open: "22:00", close: "02:00", is24x7: false }, beforeMidnight)).toBe(true);

    const afterMidnight = new Date();
    afterMidnight.setHours(1, 30, 0, 0);
    expect(isServiceOpen({ open: "22:00", close: "02:00", is24x7: false }, afterMidnight)).toBe(true);

    const lateMorning = new Date();
    lateMorning.setHours(10, 0, 0, 0);
    expect(isServiceOpen({ open: "22:00", close: "02:00", is24x7: false }, lateMorning)).toBe(false);
  });
});

describe("timeToMinutes", () => {
  it("converts morning time", () => {
    expect(timeToMinutes("09:30")).toBe(9 * 60 + 30);
  });

  it("converts afternoon time", () => {
    expect(timeToMinutes("13:45")).toBe(13 * 60 + 45);
  });

  it("converts midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });
});

describe("formatTime12h", () => {
  it("formats AM times", () => {
    expect(formatTime12h("09:30")).toBe("9:30 AM");
  });

  it("formats PM times", () => {
    expect(formatTime12h("13:45")).toBe("1:45 PM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatTime12h("12:00")).toBe("12:00 PM");
  });

  it("formats midnight as 12 AM", () => {
    expect(formatTime12h("00:00")).toBe("12:00 AM");
  });
});
