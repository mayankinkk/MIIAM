"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

/**
 * Technician share-location page. Opened from the partner app or a link
 * sent in the "Technician Assigned" notification. Watches GPS and pings
 * POST /api/tech/location every ~10s while the page is open so the
 * customer's TechnicianTracker map/ETA stays live.
 */
export default function TechShareLocationPage() {
  const params = useParams();
  const bookingId = (params.id as string) || "";
  const supabase = useRef(createClient()).current;

  const [status, setStatus] = useState<"idle" | "locating" | "sharing" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [booking, setBooking] = useState<{ service_type: string; address: string; status: string } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const ping = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch("/api/tech/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, lat, lng }),
      });
      if (res.ok) {
        setLastPing(new Date());
        setStatus("sharing");
        setErrorMsg("");
      } else if (res.status === 403) {
        setStatus("error");
        setErrorMsg("You are not assigned to this booking.");
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      } else if (res.status === 409) {
        setStatus("error");
        setErrorMsg("This booking is already completed or cancelled.");
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      }
    } catch {
      // transient network error — keep watching, next tick will retry
    }
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;

    async function loadBooking() {
      const { data } = await supabase
        .from("service_bookings")
        .select("service_type, address, status")
        .eq("id", bookingId)
        .maybeSingle();
      if (data) setBooking(data);
    }
    loadBooking();

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported on this device.");
      return;
    }

    setStatus("locating");

    const handlePos = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (lat === 0 && lng === 0) return;
      coordsRef.current = { lat, lng };
      setCoords({ lat, lng });
      setStatus("sharing");
    };
    const handleErr = (err: GeolocationPositionError) => {
      logger.error({ err }, "Technician geolocation error");
      setStatus("error");
      setErrorMsg(
        err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Please allow location access."
          : "Unable to get your location. Try moving to an open area."
      );
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePos, handleErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    // Ping server every 10s with latest coords
    pingTimerRef.current = setInterval(() => {
      if (coordsRef.current) {
        ping(coordsRef.current.lat, coordsRef.current.lng);
      }
    }, 10000);

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, [bookingId, supabase, ping]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Status card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-6 text-center shadow-sm">
          <div
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              status === "sharing"
                ? "bg-green-100 dark:bg-green-900/30"
                : status === "locating"
                ? "bg-amber-100 dark:bg-amber-900/30 animate-pulse"
                : status === "error"
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-surface-container-high"
            }`}
          >
            <span
              className={`material-symbols-outlined text-3xl ${
                status === "sharing"
                  ? "text-green-600 dark:text-green-400"
                  : status === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {status === "sharing" ? "gps_fixed" : status === "error" ? "gps_off" : "my_location"}
            </span>
          </div>

          <h1 className="text-lg font-black text-on-surface">
            {status === "sharing" ? "Sharing Live Location" : status === "locating" ? "Getting Location..." : status === "error" ? "Location Error" : "Location Sharing"}
          </h1>

          {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}

          {status === "sharing" && coords && (
            <div className="mt-4 space-y-1 text-xs text-on-surface-variant">
              <p>
                Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}
              </p>
              {lastPing && (
                <p>
                  Last ping:{" "}
                  {lastPing.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
              <p className="text-green-600 dark:text-green-400 font-bold mt-2">
                Customer can see your live position on the map. Keep this page open while you travel.
              </p>
            </div>
          )}

          {status === "locating" && (
            <p className="text-sm text-on-surface-variant mt-2">
              Waiting for a GPS lock. Make sure location services are enabled.
            </p>
          )}
        </div>

        {/* Booking summary */}
        {booking && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 mt-4 shadow-sm">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Booking</p>
            <p className="text-sm font-bold text-on-surface capitalize">{booking.service_type}</p>
            <p className="text-xs text-on-surface-variant mt-1">{booking.address}</p>
            <p className="text-xs mt-2">
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  booking.status === "in_progress"
                    ? "bg-deal/10 text-deal"
                    : booking.status === "confirmed"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {booking.status}
              </span>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-on-surface-variant mt-6">
          This page shares your GPS with the customer&apos;s live-tracking map. You can close it when the job is done.
        </p>
      </div>
    </div>
  );
}
