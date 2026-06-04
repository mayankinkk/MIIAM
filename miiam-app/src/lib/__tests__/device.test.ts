import { describe, it, expect } from "vitest";
import { parseUserAgent, deviceLabel, deviceIcon } from "../device";

describe("parseUserAgent", () => {
  it("identifies iPhone Safari", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const info = parseUserAgent(ua);
    expect(info.os).toMatch(/iOS 17\.4/);
    expect(info.browser).toBe("Safari");
    expect(info.deviceType).toBe("mobile");
  });

  it("identifies Android Chrome phone", () => {
    const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36";
    const info = parseUserAgent(ua);
    expect(info.os).toMatch(/Android 14/);
    expect(info.browser).toBe("Chrome");
    expect(info.deviceType).toBe("mobile");
  });

  it("identifies iPad as tablet", () => {
    const ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const info = parseUserAgent(ua);
    expect(info.deviceType).toBe("tablet");
    expect(info.os).toMatch(/iOS/);
  });

  it("identifies Windows Chrome desktop", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36";
    const info = parseUserAgent(ua);
    expect(info.os).toMatch(/Windows/);
    expect(info.browser).toBe("Chrome");
    expect(info.deviceType).toBe("desktop");
  });

  it("identifies macOS Safari", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
    const info = parseUserAgent(ua);
    expect(info.os).toBe("macOS");
    expect(info.browser).toBe("Safari");
    expect(info.deviceType).toBe("desktop");
  });

  it("falls back gracefully on unknown UA", () => {
    const info = parseUserAgent("garbage");
    expect(info.os).toBe("Unknown");
    expect(info.browser).toBe("Unknown");
    expect(info.deviceType).toBe("desktop");
  });
});

describe("deviceLabel", () => {
  it("formats browser + os", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    expect(deviceLabel(parseUserAgent(ua))).toMatch(/Safari on iOS/);
  });
});

describe("deviceIcon", () => {
  it("returns smartphone for mobile", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)";
    expect(deviceIcon(parseUserAgent(ua))).toBe("smartphone");
  });
  it("returns tablet for tablet", () => {
    const ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)";
    expect(deviceIcon(parseUserAgent(ua))).toBe("tablet");
  });
  it("returns computer for desktop", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    expect(deviceIcon(parseUserAgent(ua))).toBe("computer");
  });
});
