"use client";

/**
 * Shared GPS configuration and location filtering for accurate detection.
 *
 * - Kalman-inspired smoothing filter rejects jittery readings
 * - Multi-shot detection takes several readings and picks the best
 * - Standardised PositionOptions for all call sites
 */

// ─── PositionOptions presets ──────────────────────────────────────────────────

/** Optimised for continuous tracking (rider GPS, customer sharing). */
export const TRACKING_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 8000,
};

/** Optimised for one-shot detection (address picker, home page). */
export const SINGLESHOT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000,
};

/** Fallback when high-accuracy times out (cell-tower fallback). */
export const LOW_ACCURACY_FALLBACK_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30000,
  timeout: 10000,
};

// ─── Accuracy thresholds ──────────────────────────────────────────────────────

export const ACCURACY_GOOD_M = 15;
export const ACCURACY_ACCEPTABLE_M = 50;
export const ACCURACY_BAD_M = 100;

export type AccuracyLevel = "excellent" | "good" | "acceptable" | "poor";

export function classifyAccuracy(meters: number): AccuracyLevel {
  if (meters <= 10) return "excellent";
  if (meters <= ACCURACY_GOOD_M) return "good";
  if (meters <= ACCURACY_ACCEPTABLE_M) return "acceptable";
  return "poor";
}

// ─── Location filter (exponential moving average) ─────────────────────────────

export interface FilteredLocation {
  lat: number;
  lng: number;
  accuracy: number;
  age: number;
}

interface FilterState {
  lat: number | null;
  lng: number | null;
  lastTime: number;
}

const filterState: FilterState = { lat: null, lng: null, lastTime: 0 };

const SMOOTHING_FACTOR = 0.35;
const MAX_JUMP_KM = 2;
const MAX_AGE_MS = 30_000;

/**
 * Smooth GPS readings to reduce jitter.
 * Rejects readings that jump > MAX_JUMP_KM from the last accepted position
 * unless the reading is significantly more accurate.
 */
export function filterLocation(
  lat: number,
  lng: number,
  accuracy: number,
): FilteredLocation {
  const now = Date.now();

  // First reading — accept as-is
  if (filterState.lat === null || filterState.lng === null) {
    filterState.lat = lat;
    filterState.lng = lng;
    filterState.lastTime = now;
    return { lat, lng, accuracy, age: 0 };
  }

  const prevLat = filterState.lat;
  const prevLng = filterState.lng;

  // Reject stale readings
  const age = now - filterState.lastTime;
  if (age > MAX_AGE_MS) {
    filterState.lat = lat;
    filterState.lng = lng;
    filterState.lastTime = now;
    return { lat, lng, accuracy, age };
  }

  const jumpKm = haversineKm(prevLat, prevLng, lat, lng);

  // If the jump is small, smooth it
  if (jumpKm < MAX_JUMP_KM) {
    filterState.lat = prevLat + SMOOTHING_FACTOR * (lat - prevLat);
    filterState.lng = prevLng + SMOOTHING_FACTOR * (lng - prevLng);
  } else if (accuracy < ACCURACY_GOOD_M) {
    // Large jump but very accurate reading — accept it (user moved or corrected)
    filterState.lat = lat;
    filterState.lng = lng;
  }
  // else: large jump + bad accuracy → reject, keep old position

  filterState.lastTime = now;
  return {
    lat: filterState.lat ?? lat,
    lng: filterState.lng ?? lng,
    accuracy,
    age,
  };
}

export function resetFilter(): void {
  filterState.lat = null;
  filterState.lng = null;
  filterState.lastTime = 0;
}

// ─── Multi-shot detection ─────────────────────────────────────────────────────

interface MultiShotResult {
  lat: number;
  lng: number;
  accuracy: number;
  attempts: number;
}

/**
 * Take N readings and return the one with the best (lowest) accuracy.
 * Falls back to low-accuracy mode if all high-accuracy readings fail.
 */
export function multiShotDetect(
  shots = 3,
  intervalMs = 1200,
): Promise<MultiShotResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    let bestLat = 0;
    let bestLng = 0;
    let bestAccuracy = Infinity;
    let attempts = 0;
    let settled = false;

    const onSuccess = (pos: GeolocationPosition) => {
      if (settled) return;
      attempts++;
      const { latitude, longitude, accuracy } = pos.coords;

      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestLat = latitude;
        bestLng = longitude;
      }

      if (attempts >= shots || bestAccuracy <= ACCURACY_GOOD_M) {
        settled = true;
        resolve({ lat: bestLat, lng: bestLng, accuracy: bestAccuracy, attempts });
      }
    };

    const onError = () => {
      if (settled) return;
      attempts++;
      if (attempts >= shots) {
        settled = true;
        if (bestAccuracy < Infinity) {
          resolve({ lat: bestLat, lng: bestLng, accuracy: bestAccuracy, attempts });
        } else {
          reject(new Error("All GPS readings failed"));
        }
      }
    };

    // Take shots with interval
    for (let i = 0; i < shots; i++) {
      setTimeout(() => {
        if (!settled) {
          navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 8000,
          });
        }
      }, i * intervalMs);
    }
  });
}

/**
 * Multi-shot with automatic fallback to low accuracy.
 */
export async function multiShotDetectWithFallback(
  shots = 3,
): Promise<MultiShotResult> {
  try {
    return await multiShotDetect(shots);
  } catch {
    // Fallback: single low-accuracy reading
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          resolve({ lat: latitude, lng: longitude, accuracy, attempts: 1 });
        },
        reject,
        LOW_ACCURACY_FALLBACK_OPTIONS,
      );
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
