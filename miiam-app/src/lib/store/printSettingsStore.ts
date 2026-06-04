"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorMode = "bw" | "color";
export type PrintSides = "single" | "double";
export type PaperSize = "a4" | "a3";
export type Orientation = "portrait" | "landscape";
export type PaperType = "standard" | "glossy";
export type FlipDirection = "long" | "short";
export type PrintQuality = "draft" | "normal" | "high";
export type WatermarkMode = "none" | "draft" | "confidential" | "do-not-copy" | "custom";

export interface PrintDefaults {
  colorMode: ColorMode;
  sides: PrintSides;
  flipDirection: FlipDirection;
  paperSize: PaperSize;
  orientation: Orientation;
  paperType: PaperType;
  quality: PrintQuality;
  copies: number;
  watermark: WatermarkMode;
  watermarkOpacity: number;
  watermarkCustomText: string;
  ageVerified: boolean;
}

interface PrintSettingsStore {
  defaults: PrintDefaults;
  setDefault: <K extends keyof PrintDefaults>(key: K, value: PrintDefaults[K]) => void;
  setDefaults: (next: Partial<PrintDefaults>) => void;
  resetDefaults: () => void;
}

const DEFAULT: PrintDefaults = {
  colorMode: "bw",
  sides: "single",
  flipDirection: "long",
  paperSize: "a4",
  orientation: "portrait",
  paperType: "standard",
  quality: "normal",
  copies: 1,
  watermark: "none",
  watermarkOpacity: 0.15,
  watermarkCustomText: "",
  ageVerified: false,
};

export const usePrintSettingsStore = create<PrintSettingsStore>()(
  persist(
    (set) => ({
      defaults: DEFAULT,
      setDefault: (key, value) =>
        set((state) => ({ defaults: { ...state.defaults, [key]: value } })),
      setDefaults: (next) =>
        set((state) => ({ defaults: { ...state.defaults, ...next } })),
      resetDefaults: () => set({ defaults: DEFAULT }),
    }),
    { name: "miiam-print-defaults" }
  )
);

export const QUALITY_MULTIPLIER: Record<PrintQuality, number> = {
  draft: 0.8,
  normal: 1,
  high: 1.3,
};

export const QUALITY_LABEL: Record<PrintQuality, string> = {
  draft: "Draft",
  normal: "Normal",
  high: "High",
};
