import { describe, it, expect } from "vitest";
import {
  buildWatermarkSvg,
  detectSensitiveContent,
  WATERMARK_PRESETS,
  SENSITIVE_DOC_HINTS,
} from "../printing-a11y";

describe("printing-a11y: watermark SVG", () => {
  it("returns empty for none mode", () => {
    expect(buildWatermarkSvg({ mode: "none", opacity: 0.15 }, 595, 842)).toBe("");
  });

  it("embeds the watermark text", () => {
    const svg = buildWatermarkSvg({ mode: "confidential", opacity: 0.2 }, 595, 842);
    expect(svg).toContain("CONFIDENTIAL");
  });

  it("uses custom text when mode=custom", () => {
    const svg = buildWatermarkSvg({ mode: "custom", customText: "MIAMI 2026", opacity: 0.15 }, 595, 842);
    expect(svg).toContain("MIAMI 2026");
  });

  it("escapes XML special characters", () => {
    const svg = buildWatermarkSvg({ mode: "custom", customText: "<x>&'\"", opacity: 0.15 }, 100, 100);
    expect(svg).toContain("&lt;x&gt;&amp;&apos;&quot;");
  });

  it("clamps opacity to safe range", () => {
    expect(buildWatermarkSvg({ mode: "draft", opacity: 0.01 }, 100, 100)).toContain('opacity="0.05"');
    expect(buildWatermarkSvg({ mode: "draft", opacity: 2 }, 100, 100)).toContain('opacity="0.5"');
  });

  it("exports known presets", () => {
    expect(WATERMARK_PRESETS.draft).toBe("DRAFT");
    expect(WATERMARK_PRESETS.confidential).toBe("CONFIDENTIAL");
    expect(WATERMARK_PRESETS["do-not-copy"]).toBe("DO NOT COPY");
  });
});

describe("printing-a11y: detectSensitiveContent", () => {
  it("returns null for benign filenames", () => {
    expect(detectSensitiveContent("report.pdf")).toBeNull();
    expect(detectSensitiveContent("notes_2026.docx")).toBeNull();
  });

  it("flags alcohol-related filenames", () => {
    const r = detectSensitiveContent("wine-list-2026.pdf");
    expect(r).not.toBeNull();
    expect(r?.minAge).toBe(21);
  });

  it("flags firearm-related filenames", () => {
    const r = detectSensitiveContent("pistol-manual.pdf");
    expect(r).not.toBeNull();
    expect(r?.type).toBe("firearm");
  });

  it("flags adult content filenames", () => {
    const r = detectSensitiveContent("xxx-content.zip");
    expect(r).not.toBeNull();
  });

  it("catches keyword in the middle of a name", () => {
    const r = detectSensitiveContent("2026-casino-marketing-flyer.pdf");
    expect(r?.type).toBe("gambling");
  });

  it("all hint categories have valid age and type", () => {
    for (const h of SENSITIVE_DOC_HINTS) {
      expect(h.minAge).toBeGreaterThanOrEqual(18);
      expect(h.type.length).toBeGreaterThan(0);
      expect(h.keywords.length).toBeGreaterThan(0);
    }
  });
});
