"use client";

import { useState } from "react";
import { usePrintSettingsStore } from "@/lib/store/printSettingsStore";
import type {
  ColorMode,
  FlipDirection,
  Orientation,
  PaperSize,
  PaperType,
  PrintQuality,
  PrintSides,
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
}

interface PerFileSettingsProps {
  settings: PerFileSettings;
  onChange: (next: PerFileSettings) => void;
  compact?: boolean;
  pageCount: number;
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
  <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`px-2 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
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
}: PerFileSettingsProps) {
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
      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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
};
