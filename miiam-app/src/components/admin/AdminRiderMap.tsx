"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

interface RiderLocation {
  id?: string;
  rider_id: string;
  rider_name: string;
  lat: number;
  lng: number;
  created_at?: string;
  order_id?: string;
}

interface Props {
  riders: Rider[];
  onRiderClick: (rider: Rider) => void;
}

export default function AdminRiderMap({ riders, onRiderClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);
  const [locations, setLocations] = useState<RiderLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapReadyRef = useRef(false);

  const supabase = useMemo(() => createClient(), []);

  async function loadLocations() {
    const { data, error } = await supabase
      .from("rider_locations")
      .select("*");

    if (error) {
      console.error("[AdminRiderMap] loadLocations error:", error);
      return;
    }

    if (data && data.length > 0) {
      // Keep only the most recent location per rider
      const latest = new Map<string, RiderLocation>();
      for (const loc of data) {
        const existing = latest.get(loc.rider_id);
        if (!existing || (loc.id && (!existing.id || loc.id > existing.id))) {
          latest.set(loc.rider_id, loc as RiderLocation);
        }
      }
      const result = Array.from(latest.values());
      console.log("[AdminRiderMap] loaded locations:", result.map(l => `${l.rider_name}(${l.lat},${l.lng})`));
      setLocations(result);
    } else {
      console.log("[AdminRiderMap] no locations found in rider_locations table");
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted = true;

    async function init() {
      const L = await import("leaflet");
      leafletRef.current = L;

      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: false,
      }).setView([28.6139, 77.209], 12);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      mapReadyRef.current = true;

      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 1000);

      console.log("[AdminRiderMap] map initialized");
      if (isMounted) loadLocations();
    }

    init();

    return () => {
      isMounted = false;
      mapReadyRef.current = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-rider-locations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rider_locations" }, (payload) => {
        const loc = payload.new as RiderLocation;
        setLocations((prev) => {
          const filtered = prev.filter((l) => l.rider_id !== loc.rider_id);
          return [...filtered, loc];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rider_locations" }, (payload) => {
        const loc = payload.new as RiderLocation;
        setLocations((prev) => {
          const filtered = prev.filter((l) => l.rider_id !== loc.rider_id);
          return [...filtered, loc];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Update markers when locations change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReadyRef.current) {
      console.log("[AdminRiderMap] marker effect skipped - L:", !!L, "map:", !!map, "ready:", mapReadyRef.current);
      return;
    }

    console.log("[AdminRiderMap] marker effect running, locations:", locations.length);

    const currentIds = new Set(locations.map((l) => l.rider_id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    for (const loc of locations) {
      const rider = riders.find((r) => r.id === loc.rider_id);
      const online = rider?.is_online ?? false;
      const pos: [number, number] = [loc.lat, loc.lng];

      console.log("[AdminRiderMap] adding marker:", loc.rider_name, "at", pos, "online:", online);

      if (markersRef.current.has(loc.rider_id)) {
        const marker = markersRef.current.get(loc.rider_id);
        marker.setLatLng(pos);
        marker.setPopupContent(`
          <div style="min-width:140px;text-align:center;padding:4px 0">
            <p style="font-weight:900;margin:0 0 4px">${loc.rider_name || "Rider"}</p>
            <p style="font-size:11px;color:#666;margin:0 0 4px">${online ? "Online" : "Offline"}</p>
            <p style="font-size:10px;color:#999;margin:0">${loc.created_at ? new Date(loc.created_at).toLocaleTimeString() : ""}</p>
          </div>
        `);
      } else {
        // Use circleMarker for reliable rendering
        const marker = L.circleMarker(pos, {
          radius: 10,
          fillColor: online ? "#22c55e" : "#94a3b8",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 3,
          className: "rider-marker-circle",
        })
          .bindPopup(`
            <div style="min-width:140px;text-align:center;padding:4px 0">
              <p style="font-weight:900;margin:0 0 4px">${loc.rider_name || "Rider"}</p>
              <p style="font-size:11px;color:#666;margin:0 0 4px">${online ? "Online" : "Offline"}</p>
              <p style="font-size:10px;color:#999;margin:0">${loc.created_at ? new Date(loc.created_at).toLocaleTimeString() : ""}</p>
            </div>
          `)
          .addTo(map);

        marker.on("click", () => {
          if (rider) {
            setSelectedId(loc.rider_id);
            onRiderClick(rider);
          }
        });

        markersRef.current.set(loc.rider_id, marker);
      }
    }

    // Fit bounds if we have valid locations
    const validLocations = locations.filter((l) => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng) && l.lat !== 0 && l.lng !== 0);
    if (validLocations.length > 0) {
      const bounds = L.latLngBounds(validLocations.map((l) => [l.lat, l.lng] as [number, number]));
      console.log("[AdminRiderMap] fitting bounds:", validLocations.map(l => `${l.rider_name}(${l.lat},${l.lng})`));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    } else {
      console.log("[AdminRiderMap] no valid locations for fitBounds");
    }
  }, [locations, riders, onRiderClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 pointer-events-none z-[999]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">location_off</span>
            <p className="text-sm font-bold text-slate-400">No rider locations yet</p>
            <p className="text-xs text-slate-300">Riders will appear here when they start delivering</p>
          </div>
        </div>
      )}
    </div>
  );
}
