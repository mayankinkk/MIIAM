"use client";

import { useState } from "react";
import { usePrintSettingsStore } from "@/lib/store/printSettingsStore";
import { detectSensitiveContent } from "@/lib/printing-a11y";
import type {
  ColorMode,
  FlipDirection,
  Orientation,
  PaperSize,
  PaperType,
  PrintQuality,
  PrintSides,
  WatermarkMode,
} from "@/lib/store/printSettingsStore";

export interface PerFileSettings {
  colorMode: ColorMode;
  sides: PrintSides;
  flipDirection: FlipDirection;
  paperSize: PaperSize;
  orientation: Orientation;
  paperType: PaperType;
  quality: PrintQuality;
  copies: number;
  range: string;
  note: string;
  watermark: WatermarkMode;
  watermarkOpacity: number;
  watermarkCustomText: string;
  ageConfirmed: boolean;
}

interface PerFileSettingsProps {
  settings: PerFileSettings;
  onChange: (next: PerFileSettings) => void;
  compact?: boolean;
  pageCount: number;
  fileName?: string;
}

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-[11px] font-bold text-on-surface-variant block mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

const PillGroup = <T extends string>({
  options,
  value,
  onChange,
  format,
}: {
  options: { value: T; label: string; suffix?: string }[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`min-w-[60px] sm:min-w-0 sm:flex-1 px-2 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors whitespace-nowrap text-center ${
          value === opt.value
            ? "border-primary bg-primary/10 text-primary"
            : "border-outline-variant text-on-surface"
        }`}
      >
        {opt.label}
        {opt.suffix ? <span className="text-[10px] opacity-70 ml-1">{opt.suffix}</span> : null}
        {format && opt.value === value ? null : null}
      </button>
    ))}
  </div>
);

export default function PerFileSettings({
  settings,
  onChange,
  compact = false,
  pageCount,
  fileName,
}: PerFileSettingsProps) {
  const requiresAgeConfirmation = fileName ? detectSensitiveContent(fileName) : null;
  const setDefault = usePrintSettingsStore((s) => s.setDefault);
  const defaults = usePrintSettingsStore((s) => s.defaults);
  const [showAdvanced, setShowAdvanced] = useState(!compact);

  const update = <K extends keyof PerFileSettings>(key: K, value: PerFileSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const applyAsDefault = (key: keyof PerFileSettings) => {
    setDefault(key as keyof typeof defaults, settings[key] as never);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Section label="Color">
          <PillGroup
            options={[
              { value: "bw", label: "B&W" },
              { value: "color", label: "Color" },
            ]}
            value={settings.colorMode}
            onChange={(v) => update("colorMode", v)}
          />
        </Section>
        <Section label="Copies">
          <input
            type="number"
            min={1}
            max={500}
            value={settings.copies}
            onChange={(e) => update("copies", Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
            onBlur={() => applyAsDefault("copies")}
            className="w-full p-2 bg-surface-container-high rounded-lg border border-outline-variant text-center font-bold text-sm"
          />
        </Section>
      </div>

      <Section label="Sides">
        <PillGroup
          options={[
            { value: "single", label: "Single" },
            { value: "double", label: "Double" },
          ]}
          value={settings.sides}
          onChange={(v) => update("sides", v)}
        />
      </Section>

      {settings.sides === "double" && (
        <Section label="Flip on">
          <PillGroup
            options={[
              { value: "long", label: "Long edge" },
              { value: "short", label: "Short edge" },
            ]}
            value={settings.flipDirection}
            onChange={(v) => update("flipDirection", v)}
          />
        </Section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Section label="Paper">
          <PillGroup
            options={[
              { value: "a4", label: "A4" },
              { value: "a3", label: "A3" },
            ]}
            value={settings.paperSize}
            onChange={(v) => update("paperSize", v)}
          />
        </Section>
        <Section label="Orientation">
          <PillGroup
            options={[
              { value: "portrait", label: "Portrait" },
              { value: "landscape", label: "Landscape" },
            ]}
            value={settings.orientation}
            onChange={(v) => update("orientation", v)}
          />
        </Section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Section label="Paper type">
          <PillGroup
            options={[
              { value: "standard", label: "Standard" },
              { value: "glossy", label: "Glossy" },
            ]}
            value={settings.paperType}
            onChange={(v) => update("paperType", v)}
          />
        </Section>
        <Section label="Quality">
          <PillGroup
            options={[
              { value: "draft", label: "Draft", suffix: "−20%" },
              { value: "normal", label: "Normal" },
              { value: "high", label: "High", suffix: "+30%" },
            ]}
            value={settings.quality}
            onChange={(v) => update("quality", v)}
          />
        </Section>
      </div>

      {showAdvanced && (
        <>
          <Section label={`Range (max ${pageCount} pages)`}>
            <input
              type="text"
              value={settings.range}
              onChange={(e) => update("range", e.target.value)}
              placeholder="e.g. 1-5, 8, 11-13"
              className="w-full p-2 bg-surface-container-high rounded-lg border border-outline-variant font-mono text-xs"
            />
          </Section>

          <Section label="Note to operator (optional)">
            <input
              type="text"
              value={settings.note}
              onChange={(e) => update("note", e.target.value.slice(0, 200))}
              placeholder="e.g. Print page 3 in color, rest B&W"
              maxLength={200}
              className="w-full p-2 bg-surface-container-high rounded-lg border border-outline-variant text-sm"
            />
          </Section>

          <Section label="Watermark (printed on every page)">
            <PillGroup
              options={[
                { value: "none", label: "None" },
                { value: "draft", label: "DRAFT" },
                { value: "confidential", label: "CONFIDENTIAL" },
                { value: "do-not-copy", label: "DO NOT COPY" },
                { value: "custom", label: "Custom" },
              ]}
              value={settings.watermark}
              onChange={(v) => update("watermark", v)}
            />
          </Section>

          {settings.watermark !== "none" && (
            <div className="space-y-2">
              {settings.watermark === "custom" && (
                <input
                  type="text"
                  value={settings.watermarkCustomText}
                  onChange={(e) => update("watermarkCustomText", e.target.value.slice(0, 24))}
                  placeholder="Custom text (max 24 chars)"
                  maxLength={24}
                  className="w-full p-2 bg-surface-container-high rounded-lg border border-outline-variant text-sm"
                />
              )}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Opacity</label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={Math.round(settings.watermarkOpacity * 100)}
                  onChange={(e) => update("watermarkOpacity", parseInt(e.target.value) / 100)}
                  className="flex-1"
                  aria-label="Watermark opacity"
                />
                <span className="text-xs font-mono w-10 text-right">{Math.round(settings.watermarkOpacity * 100)}%</span>
              </div>
            </div>
          )}

          {requiresAgeConfirmation && (
            <label className="flex items-start gap-2 bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-xs">
              <input
                type="checkbox"
                checked={settings.ageConfirmed}
                onChange={(e) => update("ageConfirmed", e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-600"
              />
              <span className="text-amber-900 leading-snug">
                <strong>Age-restricted content.</strong> The filename suggests this file may contain {requiresAgeConfirmation.type} material
                (min age {requiresAgeConfirmation.minAge}). I confirm I am of legal age to print this content.
              </span>
            </label>
          )}
        </>
      )}

      {compact && (
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-[11px] text-primary font-bold"
        >
          {showAdvanced ? "Hide range & note" : "Show range & note"}
        </button>
      )}
    </div>
  );
}

export const DEFAULT_FILE_SETTINGS: PerFileSettings = {
  colorMode: "bw",
  sides: "single",
  flipDirection: "long",
  paperSize: "a4",
  orientation: "portrait",
  paperType: "standard",
  quality: "normal",
  copies: 1,
  range: "",
  note: "",
  watermark: "none",
  watermarkOpacity: 0.15,
  watermarkCustomText: "",
  ageConfirmed: false,
};
