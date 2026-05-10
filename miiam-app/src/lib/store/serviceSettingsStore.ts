"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ServiceCategory = 
  | "food" | "grocery" | "pharmacy" | "flowers" 
  | "ac" | "cleaning" | "plumbing" | "electrical" | "pest" | "car" | "appliance";

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
  { id: "ac", name: "AC Repair", isEnabled: true, message: "AC repair service is under maintenance", icon: "ac_unit" },
  { id: "cleaning", name: "Home Cleaning", isEnabled: true, message: "Home cleaning service is coming soon!", icon: "cleaning_services" },
  { id: "plumbing", name: "Plumbing", isEnabled: true, message: "Plumbing service is under maintenance", icon: "plumbing" },
  { id: "electrical", name: "Electrical", isEnabled: true, message: "Electrical service is coming soon!", icon: "electrical_services" },
  { id: "pest", name: "Pest Control", isEnabled: true, message: "Pest control service is under maintenance", icon: "pest_control" },
  { id: "car", name: "Car Repair", isEnabled: true, message: "Car repair service is coming soon!", icon: "directions_car" },
  { id: "appliance", name: "Appliance Repair", isEnabled: true, message: "Appliance repair is under maintenance", icon: "kitchen" },
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