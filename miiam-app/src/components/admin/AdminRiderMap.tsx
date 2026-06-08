"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

interface RiderLocation {
  rider_id: string;
  rider_name: string;
  lat: number;
  lng: number;
  created_at: string;
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

  const supabase = createClient();

  // Load rider locations
  async function loadLocations() {
    const { data } = await supabase
      .from("rider_locations")
      .select("rider_id, rider_name, lat, lng, created_at, order_id")
      .order("created_at", { ascending: false });

    if (data) {
      // Keep only the most recent location per rider
      const latest = new Map<string, RiderLocation>();
      for (const loc of data) {
        if (!latest.has(loc.rider_id) || new Date(loc.created_at) > new Date(latest.get(loc.rider_id)!.created_at)) {
          latest.set(loc.rider_id, loc);
        }
      }
      setLocations(Array.from(latest.values()));
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
        preferCanvas: true,
      }).setView([28.6139, 77.209], 12);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Multiple invalidateSize calls to handle dynamic container rendering
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 1000);
    }

    init();
    loadLocations();

    return () => {
      isMounted = false;
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
  }, []);

  // Update markers when locations change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const riderIconHtml = (name: string, online: boolean) => `
      <div style="position:relative;width:40px;height:40px;transform:translate(-20px,-40px)">
        <div style="position:absolute;inset:0;background:${online ? "rgba(34,197,94,0.2)" : "rgba(148,163,184,0.2)"};border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
        <div style="position:absolute;inset:3px;background:${online ? "#22c55e" : "#94a3b8"};border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900;">${(name || "R")[0].toUpperCase()}</div>
      </div>`;

    // Update or create markers
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

      if (markersRef.current.has(loc.rider_id)) {
        // Animate to new position
        const marker = markersRef.current.get(loc.rider_id);
        const from = marker.getLatLng();
        const to = L.latLng(pos);
        const duration = 1000;
        const start = performance.now();

        const animate = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const lat = from.lat + (to.lat - from.lat) * ease;
          const lng = from.lng + (to.lng - from.lng) * ease;
          marker.setLatLng([lat, lng]);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      } else {
        // Create new marker
        const marker = L.marker(pos, {
          icon: L.divIcon({
            className: "rider-marker",
            html: riderIconHtml(loc.rider_name, online),
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          zIndexOffset: online ? 1000 : 500,
        })
          .bindPopup(`
            <div style="min-width:140px;text-align:center;padding:4px 0">
              <p style="font-weight:900;margin:0 0 4px">${loc.rider_name || "Rider"}</p>
              <p style="font-size:11px;color:#666;margin:0 0 4px">${online ? "🟢 Online" : "⚫ Offline"}</p>
              <p style="font-size:10px;color:#999;margin:0">${new Date(loc.created_at).toLocaleTimeString()}</p>
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

    // Fit bounds if we have locations
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [locations, riders]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        .rider-marker { background: transparent !important; border: 0 !important; }
        .leaflet-container { width: 100%; height: 100%; margin: 0; padding: 0; }
        .leaflet-pane { z-index: 1; }
        .leaflet-tile-pane { z-index: 0; }
        .leaflet-overlay-pane { z-index: 2; }
        .leaflet-marker-pane { z-index: 3; }
        .leaflet-popup-pane { z-index: 4; }
        .leaflet-tile { position: absolute; left: 0; bottom: -1px; }
        .leaflet-container .leaflet-control-attribution { font-size: 9px; }
      `}</style>
      <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 pointer-events-none">
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
