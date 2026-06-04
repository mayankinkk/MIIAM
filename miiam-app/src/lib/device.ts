"use client";

export interface DeviceInfo {
  os: string;
  browser: string;
  deviceType: "mobile" | "tablet" | "desktop";
  raw: string;
}

export function parseUserAgent(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): DeviceInfo {
  const lower = ua.toLowerCase();

  let os = "Unknown";
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) {
    const m = ua.match(/os\s+([\d_]+)/i);
    os = `iOS ${(m?.[1] || "").replace(/_/g, ".")}`.trim();
  } else if (lower.includes("android")) {
    const m = ua.match(/android\s+([\d.]+)/i);
    os = `Android ${m?.[1] || ""}`.trim();
  } else if (lower.includes("windows nt 10")) os = "Windows 10/11";
  else if (lower.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (lower.includes("windows nt 6.2")) os = "Windows 8";
  else if (lower.includes("windows nt 6.1")) os = "Windows 7";
  else if (lower.includes("mac os x") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("cros")) os = "ChromeOS";
  else if (lower.includes("linux")) os = "Linux";

  let browser = "Unknown";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("chrome/") && !lower.includes("chromium")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("samsungbrowser")) browser = "Samsung Internet";

  let deviceType: DeviceInfo["deviceType"] = "desktop";
  if (/(tablet|ipad|playbook|silk)/i.test(ua)) deviceType = "tablet";
  else if (/mobi|android(?!.*tablet)|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) deviceType = "mobile";

  return { os, browser, deviceType, raw: ua };
}

export function deviceIcon(info: DeviceInfo): string {
  if (info.deviceType === "mobile") return "smartphone";
  if (info.deviceType === "tablet") return "tablet";
  return "computer";
}

export function deviceLabel(info: DeviceInfo): string {
  return `${info.browser} on ${info.os}`;
}
