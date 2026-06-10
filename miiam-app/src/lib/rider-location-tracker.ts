"use client";

import { createClient } from "@/lib/supabase/client";

export interface LocationUpdate {
  lat: number;
  lng: number;
}

export interface RiderLocationData {
  order_id: string;
  rider_id: string;
  rider_name?: string;
  rider_phone?: string;
  lat: number;
  lng: number;
  created_at: string;
}

export class RiderLocationTracker {
  private watchId: number | null = null;
  private currentOrderId: string | null = null;
  private currentRiderId: string | null = null;
  private supabase: ReturnType<typeof createClient>;
  private riderName: string;
  private riderPhone: string;
  private onLocationUpdate?: (location: LocationUpdate) => void;
  private onError?: (error: GeolocationPositionError) => void;

  constructor(
    riderId: string,
    orderId: string,
    options?: {
      riderName?: string;
      riderPhone?: string;
      onLocationUpdate?: (location: LocationUpdate) => void;
      onError?: (error: GeolocationPositionError) => void;
    }
  ) {
    this.currentRiderId = riderId;
    this.currentOrderId = orderId;
    this.supabase = createClient();
    this.riderName = options?.riderName || "Rider";
    this.riderPhone = options?.riderPhone || "";
    this.onLocationUpdate = options?.onLocationUpdate;
    this.onError = options?.onError;
  }

  async start(): Promise<void> {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    // Clear any existing watch
    this.stop();

    const updateLocation = async (position: GeolocationPosition) => {
      if (!this.currentOrderId || !this.currentRiderId) return;

      const { latitude, longitude } = position.coords;

      try {
        await this.supabase.from("rider_locations").upsert({
          order_id: this.currentOrderId,
          rider_id: this.currentRiderId,
          rider_name: this.riderName,
          rider_phone: this.riderPhone,
          lat: latitude,
          lng: longitude,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'order_id'
        });

        this.onLocationUpdate?.({ lat: latitude, lng: longitude });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (error) => {
        console.error("Initial location error:", error);
        this.onError?.(error);
      },
      { enableHighAccuracy: true }
    );

    // Watch position and update every 3 seconds
    this.watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error("Location watch error:", error);
        this.onError?.(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 5000,
      }
    );

    console.log("Location tracking started for order:", this.currentOrderId);
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log("Location tracking stopped for order:", this.currentOrderId);
    }
    this.currentOrderId = null;
    this.currentRiderId = null;
  }

  async updateLocationOnce(): Promise<LocationUpdate | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const supabase = createClient();

          try {
            if (this.currentOrderId && this.currentRiderId) {
              await supabase.from("rider_locations").upsert({
                order_id: this.currentOrderId,
                rider_id: this.currentRiderId,
                lat: latitude,
                lng: longitude,
                created_at: new Date().toISOString(),
              }, {
                onConflict: 'order_id'
              });
            }
            resolve({ lat: latitude, lng: longitude });
          } catch (error) {
            console.error("Failed to update location:", error);
            resolve(null);
          }
        },
        (error) => {
          console.error("Failed to get location:", error);
          this.onError?.(error);
          resolve(null);
        },
        { enableHighAccuracy: true }
      );
    });
  }

  getOrderId(): string | null {
    return this.currentOrderId;
  }

  getRiderId(): string | null {
    return this.currentRiderId;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }
}

export function createRiderLocationTracker(
  riderId: string,
  orderId: string,
  options?: {
    riderName?: string;
    riderPhone?: string;
    onLocationUpdate?: (location: LocationUpdate) => void;
    onError?: (error: GeolocationPositionError) => void;
  }
): RiderLocationTracker {
  return new RiderLocationTracker(riderId, orderId, options);
}

// Backward compatibility functions (deprecated)
let _legacyWatchId: number | null = null;
let _legacyOrderId: string | null = null;
let _legacyRiderId: string | null = null;
let _legacySupabase: ReturnType<typeof createClient> | null = null;

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

  _legacySupabase = createClient();
  _legacyOrderId = orderId;
  _legacyRiderId = riderId;

  stopLocationTracking();

  const updateLocation = async (position: GeolocationPosition) => {
    if (!_legacyOrderId || !_legacyRiderId || !_legacySupabase) return;

    const { latitude, longitude } = position.coords;

    try {
      await _legacySupabase.from("rider_locations").upsert({
        order_id: _legacyOrderId,
        rider_id: _legacyRiderId,
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

  navigator.geolocation.getCurrentPosition(
    updateLocation,
    (error) => console.error("Initial location error:", error),
    { enableHighAccuracy: true }
  );

  _legacyWatchId = navigator.geolocation.watchPosition(
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
  if (_legacyWatchId !== null) {
    navigator.geolocation.clearWatch(_legacyWatchId);
    _legacyWatchId = null;
    console.log("Location tracking stopped");
  }
  _legacyOrderId = null;
  _legacyRiderId = null;
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