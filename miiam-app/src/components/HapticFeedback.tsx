"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HapticSettings {
  enabled: boolean;
  light: boolean;
  medium: boolean;
  heavy: boolean;
}

interface HapticStore {
  settings: HapticSettings;
  updateSetting: (key: keyof HapticSettings, value: boolean) => void;
  triggerHaptic: (type?: "light" | "medium" | "heavy") => void;
}

export const useHapticStore = create<HapticStore>()(
  persist(
    (set, get) => ({
      settings: {
        enabled: true,
        light: true,
        medium: true,
        heavy: true,
      },

      updateSetting: (key, value) => {
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        }));
      },

      triggerHaptic: (type = "medium") => {
        const { settings } = get();
        if (!settings.enabled || !settings[type]) return;
        
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          const patterns: Record<string, number | number[]> = {
            light: 10,
            medium: 25,
            heavy: [50, 30, 50],
          };
          navigator.vibrate(patterns[type]);
        }
      },
    }),
    { name: "miiam-haptic-settings" }
  )
);

export function HapticToggle({ 
  label, 
  description,
  settingKey,
}: { 
  label: string; 
  description?: string;
  settingKey: keyof HapticSettings;
}) {
  const { settings, updateSetting } = useHapticStore();
  const isEnabled = settings[settingKey] as boolean;

  return (
    <button
      onClick={() => updateSetting(settingKey, !isEnabled)}
      className="w-full flex items-center justify-between py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          isEnabled ? "bg-[#ba001c]/10" : "bg-slate-100"
        }`}>
          <span className={`material-symbols-outlined ${isEnabled ? "text-[#ba001c]" : "text-slate-400"}`}>
            vibration
          </span>
        </div>
        <div className="text-left">
          <p className="font-semibold text-slate-800">{label}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className={`w-12 h-7 rounded-full relative transition-colors ${
        isEnabled ? "bg-[#ba001c]" : "bg-slate-300"
      }`}>
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
          isEnabled ? "left-6" : "left-1"
        }`} />
      </div>
    </button>
  );
}

export function HapticButton({ 
  children, 
  onClick,
  type = "medium" as "light" | "medium" | "heavy",
  className = "",
}: { 
  children: React.ReactNode; 
  onClick: () => void;
  type?: "light" | "medium" | "heavy";
  className?: string;
}) {
  const { triggerHaptic } = useHapticStore();

  const handleClick = () => {
    triggerHaptic(type);
    onClick();
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}