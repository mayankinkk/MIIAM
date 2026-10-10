"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

const RiderMap = dynamic(() => import("@/components/rider/RiderMap"), {
  ssr: false,
  loading: () => <div className="bg-surface-container h-56 animate-pulse rounded-2xl" />,
});

interface BookingData {
  id: string;
  status: string;
  address: string | null;
  technician_name: string | null;
  technician_phone: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  amount: number | null;
  sub_service: string | null;
  service_type: string | null;
  lat: number | null;
  lng: number | null;
}

interface TechnicianTrackerProps {
  booking: BookingData;
}

const ACTIVE_STATUSES = ["confirmed", "in_progress", "en_route", "assigned"];

export default function TechnicianTracker({ booking }: TechnicianTrackerProps) {
  const supabase = useMemo(() => createClient(), []);
  const addToast = useToastStore((s) => s.addToast);
  const [techLoc, setTechLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const hasTechnician = !!booking.technician_name;
  const isActive = ACTIVE_STATUSES.includes(booking.status);

  // Subscribe to live technician location via rider_locations (shared tracking table)
  useEffect(() => {
    if (!hasTechnician || !isActive) return;

    let cancelled = false;

    async function fetchLocation() {
      try {
        const { data } = await supabase
          .from("rider_locations")
          .select("lat, lng, updated_at")
          .eq("order_id", booking.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && data?.lat != null && data?.lng != null) {
          setTechLoc({ lat: data.lat, lng: data.lng });
        }
      } catch {
        // table may not have rows for service bookings
      }
    }
    fetchLocation();

    const channel = supabase
      .channel(`tech-track-${booking.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${booking.id}`,
        },
        (payload: { new: unknown }) => {
          const row = payload.new as { lat?: number; lng?: number } | null;
          if (row?.lat != null && row?.lng != null) {
            setTechLoc({ lat: row.lat, lng: row.lng });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [booking.id, hasTechnician, isActive, supabase]);

  const handleRouteUpdate = useCallback(
    (info: { eta: number; distance: string; leg: "to_pickup" | "to_drop" }) => {
      if (info.leg === "to_drop" || info.leg === "to_pickup") {
        setEta(info.eta);
      }
    },
    []
  );

  const callTechnician = () => {
    if (booking.technician_phone) {
      window.location.href = `tel:${booking.technician_phone}`;
    }
  };

  const messageTechnician = () => {
    if (booking.technician_phone) {
      window.open(`https://wa.me/${booking.technician_phone.replace(/\D/g, "")}`, "_blank");
    } else {
      addToast("Technician contact not available yet.", "error");
    }
  };

  if (!hasTechnician) {
    if (!isActive) return null;
    return (
      <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-6 text-center">
        <span className="material-symbols-outlined mb-3 block text-5xl text-amber-500">
          person_search
        </span>
        <h2 className="text-on-surface mb-1 text-lg font-bold">Finding your technician</h2>
        <p className="text-on-surface-variant text-sm">
          We&apos;re assigning a technician to your booking. You&apos;ll be notified once confirmed.
        </p>
        <div className="text-on-surface-variant mt-4 flex items-center justify-center gap-2 text-xs">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          Searching nearby technicians…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live map when tech is moving, or booking is active */}
      {isActive && (techLoc || booking.address) && (
        <div className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-2xl border">
          <div className="h-56">
            <RiderMap
              pickup={techLoc ? { ...techLoc, label: "Technician", kind: "rider" as const } : null}
              dropoff={{
                lat: booking.lat || 0,
                lng: booking.lng || 0,
                label: booking.address || "Your address",
                kind: "home" as const,
              }}
              riderLocation={techLoc ? { ...techLoc, updatedAt: new Date().toISOString() } : null}
              onRouteUpdate={handleRouteUpdate}
              height="100%"
            />
          </div>
          {eta != null && (
            <div className="border-outline-variant/10 flex items-center gap-2 border-t px-4 py-3">
              <span className="material-symbols-outlined text-accent text-lg">schedule</span>
              <p className="text-on-surface text-sm font-bold">Arriving in ~{eta} min</p>
            </div>
          )}
        </div>
      )}

      {/* Technician card */}
      <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-accent text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <h2 className="text-accent text-sm font-bold">Technician Assigned</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-accent text-2xl">engineering</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-on-surface text-base font-bold">{booking.technician_name}</p>
            {booking.technician_phone && (
              <p className="text-on-surface-variant mt-0.5 text-sm">{booking.technician_phone}</p>
            )}
            {eta != null && <p className="text-accent mt-1 text-xs font-bold">ETA ~{eta} min</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {booking.technician_phone && (
              <>
                <button
                  onClick={callTechnician}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all hover:bg-green-200 active:scale-95"
                  aria-label="Call technician"
                >
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button
                  onClick={messageTechnician}
                  className="bg-primary/10 text-accent hover:bg-primary/20 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95"
                  aria-label="Message technician"
                >
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
