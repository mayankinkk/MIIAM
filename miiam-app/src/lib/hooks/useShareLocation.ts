"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SharedLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

interface UseShareLocationOptions {
  orderId: string;
  userId: string | null;
  /** Stop automatically when the order is delivered/cancelled */
  active?: boolean;
}

export function useShareLocation({ orderId, userId, active = true }: UseShareLocationOptions) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<SharedLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(async () => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stoppedRef.current = true;
    setSharing(false);
    if (userId && orderId) {
      try {
        await supabase
          .from("customer_locations")
          .update({ is_sharing: false, updated_at: new Date().toISOString() })
          .eq("order_id", orderId)
          .eq("user_id", userId);
      } catch (_) {
        // best effort
      }
    }
  }, [orderId, userId, supabase]);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported on this device");
      return false;
    }
    if (!userId) {
      setError("Please sign in to share your location");
      return false;
    }
    setError(null);
    stoppedRef.current = false;
    setSharing(true);

    const write = async (pos: GeolocationPosition) => {
      if (stoppedRef.current) return;
      const { latitude, longitude, accuracy, heading, speed } = pos.coords;
      const payload = {
        order_id: orderId,
        user_id: userId,
        lat: latitude,
        lng: longitude,
        accuracy,
        heading: heading ?? null,
        speed: speed ?? null,
        is_sharing: true,
        updated_at: new Date().toISOString(),
      };
      try {
        await supabase.from("customer_locations").upsert(payload, { onConflict: "order_id" });
        setLastSent({
          lat: latitude,
          lng: longitude,
          accuracy,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
          updatedAt: payload.updated_at,
        });
      } catch (e: any) {
        console.error("Failed to share location", e);
        setError(e?.message || "Failed to share location");
      }
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message || "Location permission denied");
      stop();
    };

    navigator.geolocation.getCurrentPosition(write, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 8000,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(write, onError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });
    return true;
  }, [orderId, userId, supabase, stop]);

  // Auto-stop when order becomes inactive
  useEffect(() => {
    if (!active && sharing) {
      stop();
    }
  }, [active, sharing, stop]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { sharing, error, lastSent, start, stop };
}

interface UseCustomerLocationOptions {
  orderId: string | null;
  /** Whether the current user is allowed to read this location (rider / vendor) */
  enabled: boolean;
}

export function useCustomerLocation({ orderId, enabled }: UseCustomerLocationOptions) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [location, setLocation] = useState<SharedLocation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId || !enabled) return;
    setLoading(true);

    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) {
        setLocation({
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          heading: data.heading,
          speed: data.speed,
          updatedAt: data.updated_at,
        });
      }
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`customer-location-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          setLocation({
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            heading: row.heading,
            speed: row.speed,
            updatedAt: row.updated_at,
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, enabled, supabase]);

  return { location, loading };
}
