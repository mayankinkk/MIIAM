"use client";

import { createClient } from "@/lib/supabase/client";
import { filterLocation, TRACKING_POSITION_OPTIONS, ACCURACY_BAD_M } from "@/lib/location-detection";
import logger from "@/lib/logger";

const log = logger.child({ module: "rider-location-tracker" });

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
      log.warn("Geolocation not supported");
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
        log.error({ err: error }, "Failed to update location");
      }
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (latitude === 0 && longitude === 0) return;
        const filtered = filterLocation(latitude, longitude, pos.coords.accuracy ?? ACCURACY_BAD_M);
        updateLocation({ ...pos, coords: { ...pos.coords, latitude: filtered.lat, longitude: filtered.lng } });
      },
      (error) => {
        log.error({ err: error }, "Initial location error");
        this.onError?.(error);
      },
      TRACKING_POSITION_OPTIONS,
    );

    // Watch position and update
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (latitude === 0 && longitude === 0) return;
        const filtered = filterLocation(latitude, longitude, pos.coords.accuracy ?? ACCURACY_BAD_M);
        updateLocation({ ...pos, coords: { ...pos.coords, latitude: filtered.lat, longitude: filtered.lng } });
      },
      (error) => {
        log.error({ err: error }, "Location watch error");
        this.onError?.(error);
      },
      TRACKING_POSITION_OPTIONS,
    );

    log.info({ orderId: this.currentOrderId }, "Location tracking started");
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      log.info({ orderId: this.currentOrderId }, "Location tracking stopped");
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
          const filtered = filterLocation(latitude, longitude, position.coords.accuracy ?? ACCURACY_BAD_M);

          try {
            if (this.currentOrderId && this.currentRiderId) {
              await this.supabase.from("rider_locations").upsert({
                order_id: this.currentOrderId,
                rider_id: this.currentRiderId,
                lat: filtered.lat,
                lng: filtered.lng,
                created_at: new Date().toISOString(),
              }, {
                onConflict: 'order_id'
              });
            }
            resolve({ lat: filtered.lat, lng: filtered.lng });
          } catch (error) {
            log.error({ err: error }, "Failed to update location");
            resolve(null);
          }
        },
        (error) => {
          log.error({ err: error }, "Failed to get location");
          this.onError?.(error);
          resolve(null);
        },
        TRACKING_POSITION_OPTIONS,
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

/**
 * @deprecated Use `createRiderLocationTracker()` instead.
 * These functions use module-level mutable state and create redundant Supabase clients.
 * Will be removed in a future version.
 */
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
    log.warn("Geolocation not supported");
    return;
  }

  _legacySupabase = createClient();
  _legacyOrderId = orderId;
  _legacyRiderId = riderId;

  stopLocationTracking();

  const updateLocation = async (position: GeolocationPosition) => {
    if (!_legacyOrderId || !_legacyRiderId || !_legacySupabase) return;

    const { latitude, longitude } = position.coords;
    const filtered = filterLocation(latitude, longitude, position.coords.accuracy ?? ACCURACY_BAD_M);

    try {
      await _legacySupabase.from("rider_locations").upsert({
        order_id: _legacyOrderId,
        rider_id: _legacyRiderId,
        rider_name: riderName || "Rider",
        rider_phone: riderPhone || "",
        lat: filtered.lat,
        lng: filtered.lng,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'order_id'
      });
    } catch (error) {
      log.error({ err: error }, "Failed to update location");
    }
  };

  navigator.geolocation.getCurrentPosition(
    updateLocation,
    (error) => log.error({ err: error }, "Initial location error"),
    TRACKING_POSITION_OPTIONS,
  );

  _legacyWatchId = navigator.geolocation.watchPosition(
    updateLocation,
    (error) => log.error({ err: error }, "Location watch error"),
    TRACKING_POSITION_OPTIONS,
  );

  log.info({ orderId }, "Location tracking started");
}

export function stopLocationTracking() {
  if (_legacyWatchId !== null) {
    navigator.geolocation.clearWatch(_legacyWatchId);
    _legacyWatchId = null;
    log.info("Location tracking stopped");
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
        const filtered = filterLocation(latitude, longitude, position.coords.accuracy ?? ACCURACY_BAD_M);

        try {
          if (_legacySupabase) {
            await _legacySupabase.from("rider_locations").upsert({
              order_id: orderId,
              rider_id: riderId,
              lat: filtered.lat,
              lng: filtered.lng,
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'order_id'
            });
          }
          resolve({ lat: filtered.lat, lng: filtered.lng });
        } catch (error) {
          log.error({ err: error }, "Failed to update location");
          resolve(null);
        }
      },
      (error) => {
        log.error({ err: error }, "Failed to get location");
        resolve(null);
      },
      TRACKING_POSITION_OPTIONS,
    );
  });
}
