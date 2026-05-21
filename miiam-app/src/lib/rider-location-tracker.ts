"use client";

import { createClient } from "@/lib/supabase/client";

let watchId: number | null = null;
let currentOrderId: string | null = null;
let currentRiderId: string | null = null;
let supabase: any = null;

export async function startLocationTracking(
  riderId: string,
  orderId: string,
  riderName?: string,
  riderPhone?: string
) {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return;
  }

  supabase = createClient();
  currentOrderId = orderId;
  currentRiderId = riderId;

  // Clear any existing watch
  stopLocationTracking();

  const updateLocation = async (position: GeolocationPosition) => {
    if (!currentOrderId || !currentRiderId) return;

    const { latitude, longitude } = position.coords;

    try {
      // Upsert location - insert new or update existing for this order
      await supabase.from("rider_locations").upsert({
        order_id: currentOrderId,
        rider_id: currentRiderId,
        rider_name: riderName || "Rider",
        rider_phone: riderPhone || "",
        lat: latitude,
        lng: longitude,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'order_id'
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  // Get initial position
  navigator.geolocation.getCurrentPosition(
    updateLocation,
    (error) => console.error("Initial location error:", error),
    { enableHighAccuracy: true }
  );

  // Watch position and update every 3 seconds
  watchId = navigator.geolocation.watchPosition(
    updateLocation,
    (error) => console.error("Location watch error:", error),
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 5000,
    }
  );

  console.log("Location tracking started for order:", orderId);
}

export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log("Location tracking stopped");
  }
  currentOrderId = null;
  currentRiderId = null;
}

export async function updateRiderLocation(orderId: string, riderId: string) {
  return new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const supabase = createClient();

        try {
          await supabase.from("rider_locations").upsert({
            order_id: orderId,
            rider_id: riderId,
            lat: latitude,
            lng: longitude,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'order_id'
          });
          resolve({ lat: latitude, lng: longitude });
        } catch (error) {
          console.error("Failed to update location:", error);
          resolve(null);
        }
      },
      (error) => {
        console.error("Failed to get location:", error);
        resolve(null);
      },
      { enableHighAccuracy: true }
    );
  });
}