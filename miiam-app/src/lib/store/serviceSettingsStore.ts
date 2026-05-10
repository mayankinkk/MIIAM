"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ServiceCategory = "food" | "grocery" | "pharmacy" | "flowers" | "beauty" | "services";

export interface ServiceSetting {
  id: ServiceCategory;
  name: string;
  isEnabled: boolean;
  message: string;
  icon: string;
}

interface ServiceSettingsStore {
  settings: ServiceSetting[];
  updateSetting: (id: ServiceCategory, updates: Partial<ServiceSetting>) => void;
  getSetting: (id: ServiceCategory) => ServiceSetting | undefined;
  isServiceEnabled: (id: ServiceCategory) => boolean;
}

const defaultSettings: ServiceSetting[] = [
  { id: "food", name: "Food Delivery", isEnabled: true, message: "Food delivery is currently under maintenance", icon: "restaurant" },
  { id: "grocery", name: "Grocery", isEnabled: true, message: "Grocery service is coming soon!", icon: "shopping_cart" },
  { id: "pharmacy", name: "Pharmacy", isEnabled: true, message: "Pharmacy service is under maintenance", icon: "medication" },
  { id: "flowers", name: "Flowers", isEnabled: true, message: "Flower delivery is coming soon!", icon: "local_florist" },
  { id: "beauty", name: "Beauty & Wellness", isEnabled: true, message: "Beauty services are coming soon!", icon: "spa" },
  { id: "services", name: "Home Services", isEnabled: true, message: "Home services are under maintenance", icon: "home_repair_service" },
];

export const useServiceSettingsStore = create<ServiceSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSetting: (id, updates) => {
        set((state) => ({
          settings: state.settings.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      getSetting: (id) => {
        return get().settings.find((s) => s.id === id);
      },

      isServiceEnabled: (id) => {
        const setting = get().settings.find((s) => s.id === id);
        return setting?.isEnabled ?? true;
      },
    }),
    { name: "miiam-service-settings" }
  )
);