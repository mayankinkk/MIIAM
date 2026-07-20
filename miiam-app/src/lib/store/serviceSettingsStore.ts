"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

export type ServiceCategory =
  | "food" | "flowers" | "beauty"
  | "ac" | "cleaning" | "plumbing" | "electrical" | "pest" | "car" | "appliance";

export interface ServiceHours {
  open: string;
  close: string;
  is24x7: boolean;
}

export interface ServiceSetting {
  id: ServiceCategory;
  name: string;
  isEnabled: boolean;
  message: string;
  icon: string;
  hours: ServiceHours;
}

interface ServiceSettingsStore {
  settings: ServiceSetting[];
  _synced: boolean;
  updateSetting: (id: ServiceCategory, updates: Partial<ServiceSetting>) => void;
  updateHours: (id: ServiceCategory, hours: Partial<ServiceHours>) => void;
  getSetting: (id: ServiceCategory) => ServiceSetting | undefined;
  isServiceEnabled: (id: ServiceCategory) => boolean;
  isServiceOpenNow: (id: ServiceCategory, now?: Date) => boolean;
  formatServiceHours: (id: ServiceCategory) => string;
  syncFromSupabase: () => Promise<void>;
}

const defaultHours: ServiceHours = {
  open: "06:00",
  close: "23:59",
  is24x7: false,
};

const defaultSettings: ServiceSetting[] = [
  { id: "food", name: "Food Delivery", isEnabled: true, message: "Food delivery is currently under maintenance", icon: "restaurant", hours: defaultHours },
  { id: "beauty", name: "Beauty & Wellness", isEnabled: true, message: "Beauty service is under maintenance", icon: "spa", hours: defaultHours },
  { id: "ac", name: "AC Repair", isEnabled: true, message: "AC repair service is under maintenance", icon: "ac_unit", hours: defaultHours },
  { id: "cleaning", name: "Home Cleaning", isEnabled: true, message: "Home cleaning service is coming soon!", icon: "cleaning_services", hours: defaultHours },
  { id: "plumbing", name: "Plumbing", isEnabled: true, message: "Plumbing service is under maintenance", icon: "plumbing", hours: defaultHours },
  { id: "electrical", name: "Electrical", isEnabled: true, message: "Electrical service is coming soon!", icon: "electrical_services", hours: defaultHours },
  { id: "pest", name: "Pest Control", isEnabled: true, message: "Pest control service is under maintenance", icon: "pest_control", hours: defaultHours },
  { id: "car", name: "Car Repair", isEnabled: true, message: "Car repair service is coming soon!", icon: "directions_car", hours: defaultHours },
  { id: "appliance", name: "Appliance Repair", isEnabled: true, message: "Appliance repair is under maintenance", icon: "kitchen", hours: defaultHours },
];

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

export function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function isServiceOpen(hours: ServiceHours, now: Date = new Date()): boolean {
  if (hours.is24x7) return true;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  if (openMin === closeMin) return true;
  if (closeMin > openMin) {
    return nowMin >= openMin && nowMin < closeMin;
  }
  return nowMin >= openMin || nowMin < closeMin;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSyncToSupabase(id: ServiceCategory, updates: Partial<ServiceSetting> | Partial<ServiceHours>) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if ("isEnabled" in updates) payload.is_enabled = (updates as Partial<ServiceSetting>).isEnabled;
      if ("message" in updates) payload.message = (updates as Partial<ServiceSetting>).message;
      if ("hours" in updates) {
        const h = (updates as Partial<ServiceHours>);
        if (h.open !== undefined) payload.hours_open = h.open;
        if (h.close !== undefined) payload.hours_close = h.close;
        if (h.is24x7 !== undefined) payload.hours_is_24x7 = h.is24x7;
      }
      await supabase.from("service_settings").upsert({ id, ...payload }, { onConflict: "id" });
    } catch (e) {
      logger.error({ err: e }, "[serviceSettings] Failed to sync to Supabase");
    }
  }, 300);
}

export const useServiceSettingsStore = create<ServiceSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      _synced: false,

      updateSetting: (id, updates) => {
        set((state) => ({
          settings: state.settings.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
        scheduleSyncToSupabase(id, updates);
      },

      updateHours: (id, hours) => {
        set((state) => ({
          settings: state.settings.map((s) =>
            s.id === id
              ? { ...s, hours: { ...s.hours, ...hours } }
              : s
          ),
        }));
        scheduleSyncToSupabase(id, hours);
      },

      getSetting: (id) => {
        return get().settings.find((s) => s.id === id);
      },

      isServiceEnabled: (id) => {
        const setting = get().settings.find((s) => s.id === id);
        return setting?.isEnabled ?? true;
      },

      isServiceOpenNow: (id, now) => {
        const setting = get().settings.find((s) => s.id === id);
        if (!setting) return true;
        return isServiceOpen(setting.hours, now);
      },

      formatServiceHours: (id) => {
        const setting = get().settings.find((s) => s.id === id);
        if (!setting) return "";
        if (setting.hours.is24x7) return "24×7";
        return `${formatTime12h(setting.hours.open)} - ${formatTime12h(setting.hours.close)}`;
      },

      syncFromSupabase: async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("service_settings")
            .select("id, name, is_enabled, message, icon, hours_open, hours_close, hours_is_24x7");
          if (data && data.length > 0) {
            const synced: ServiceSetting[] = data.map((row: { id: string; name: string; is_enabled: boolean; message: string; icon: string; hours_open: string; hours_close: string; hours_is_24x7: boolean }) => ({
              id: row.id as ServiceCategory,
              name: row.name,
              isEnabled: row.is_enabled,
              message: row.message,
              icon: row.icon,
              hours: {
                open: row.hours_open,
                close: row.hours_close,
                is24x7: row.hours_is_24x7,
              },
            }));
            set({ settings: synced, _synced: true });
          }
        } catch (e) {
          logger.error({ err: e }, "[serviceSettings] Failed to sync from Supabase");
        }
      },
    }),
    { name: "miiam-service-settings" }
  )
);
