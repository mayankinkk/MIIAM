export type WatermarkMode = "none" | "draft" | "confidential" | "do-not-copy" | "custom";
export type ContrastMode = "normal" | "high";

export interface WatermarkConfig {
  mode: WatermarkMode;
  customText?: string;
  opacity: number;
}

export const WATERMARK_PRESETS: Record<Exclude<WatermarkMode, "none" | "custom">, string> = {
  draft: "DRAFT",
  confidential: "CONFIDENTIAL",
  "do-not-copy": "DO NOT COPY",
};

export function buildWatermarkSvg(config: WatermarkConfig, width: number, height: number): string {
  if (config.mode === "none") return "";
  const text = config.mode === "custom" ? (config.customText || "CUSTOM") : WATERMARK_PRESETS[config.mode as Exclude<WatermarkMode, "none" | "custom">];
  const opacity = Math.max(0.05, Math.min(0.5, config.opacity || 0.15));
  const fontSize = Math.max(36, Math.floor(Math.min(width, height) / 5));
  const rotation = -30;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="rotate(${rotation} ${width / 2} ${height / 2})" opacity="${opacity}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="${fontSize}"
      fill="#000" stroke="#fff" stroke-width="1">${escapeXml(text)}</text>
  </g>
</svg>`;
  return svg;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const AGE_RESTRICTED_KEYWORDS = [
  "alcohol",
  "beer",
  "wine",
  "whisky",
  "whiskey",
  "vodka",
  "rum",
  "gin",
  "cannabis",
  "marijuana",
  "weed",
  "tobacco",
  "cigarette",
  "vape",
  "firearm",
  "gun",
  "pistol",
  "rifle",
  "shotgun",
  "ammunition",
  "bullet",
  "adult",
  "xxx",
  "porn",
  "erotic",
  "nsfw",
  "gambling",
  "casino",
  "bet",
];

export const SENSITIVE_DOC_HINTS: { keywords: string[]; type: string; minAge: number }[] = [
  { keywords: ["alcohol", "beer", "wine", "whisky", "whiskey", "vodka", "rum", "gin", "liquor", "spirits"], type: "alcohol-advertising", minAge: 21 },
  { keywords: ["cannabis", "marijuana", "weed", "thc", "cbd"], type: "cannabis-product", minAge: 21 },
  { keywords: ["tobacco", "cigarette", "vape", "e-cigarette", "nicotine"], type: "tobacco-product", minAge: 18 },
  { keywords: ["firearm", "gun", "pistol", "rifle", "shotgun", "ammunition", "bullet", "magazine"], type: "firearm", minAge: 18 },
  { keywords: ["gambling", "casino", "bet", "betting", "lottery", "wager", "poker", "blackjack"], type: "gambling", minAge: 18 },
  { keywords: ["adult", "xxx", "porn", "erotic", "nsfw", "sex toy", "condom"], type: "adult-content", minAge: 18 },
];

export interface SensitiveMatch {
  type: string;
  minAge: number;
  matchedKeywords: string[];
}

export function detectSensitiveContent(fileName: string): SensitiveMatch | null {
  const lower = fileName.toLowerCase();
  for (const hint of SENSITIVE_DOC_HINTS) {
    const matched = hint.keywords.filter((k) => lower.includes(k));
    if (matched.length > 0) {
      return { type: hint.type, minAge: hint.minAge, matchedKeywords: matched };
    }
  }
  return null;
}

export const HIGH_CONTRAST_CLASSES = "contrast-more:border-2 contrast-more:border-black dark:contrast-more:border-white";
