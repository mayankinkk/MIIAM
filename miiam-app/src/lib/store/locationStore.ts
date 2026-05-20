import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  displayAddress: string;
  setLocation: (loc: {
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
    displayAddress?: string;
  }) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: null,
      state: null,
      country: null,
      lat: null,
      lng: null,
      displayAddress: "Select Location",
      setLocation: (loc) => set((prev) => ({ ...prev, ...loc })),
      clearLocation: () => set({
        city: null, state: null, country: null,
        lat: null, lng: null, displayAddress: "Select Location"
      }),
    }),
    { name: "miiam-user-location" }
  )
);
