"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

interface Props {
  riders: Rider[];
  onRiderClick: (rider: Rider) => void;
}

export default function AdminRiderMap({ riders, onRiderClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Riders that have valid coordinates
  const locatedRiders = useMemo(
    () => riders.filter((r) => r.current_lat && r.current_lng && r.current_lat !== 0 && r.current_lng !== 0),
    [riders]
  );

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

      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 1000);
    }

    init();

    return () => {
      isMounted = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when riders change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const currentIds = new Set(locatedRiders.map((r) => r.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    for (const rider of locatedRiders) {
      const pos: [number, number] = [rider.current_lat!, rider.current_lng!];

      if (markersRef.current.has(rider.id)) {
        const marker = markersRef.current.get(rider.id);
        const from = marker.getLatLng();
        const to = L.latLng(pos);
        const duration = 1000;
        const start = performance.now();

        const animate = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          marker.setLatLng([
            from.lat + (to.lat - from.lat) * ease,
            from.lng + (to.lng - from.lng) * ease,
          ]);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      } else {
        const online = rider.is_online;
        const name = rider.name || "Rider";

        const marker = L.circleMarker(pos, {
          radius: 10,
          fillColor: online ? "#22c55e" : "#94a3b8",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 3,
        })
          .bindPopup(
            `<div style="min-width:140px;text-align:center;padding:4px 0">
              <p style="font-weight:900;margin:0 0 4px">${name}</p>
              <p style="font-size:11px;color:#666;margin:0 0 4px">${online ? "Online" : "Offline"}</p>
              <p style="font-size:10px;color:#999;margin:0">${rider.total_deliveries || 0} deliveries</p>
            </div>`
          )
          .addTo(map);

        marker.on("click", () => {
          setSelectedId(rider.id);
          onRiderClick(rider);
        });

        markersRef.current.set(rider.id, marker);
      }
    }

    // Fit bounds to show all riders
    if (locatedRiders.length > 0) {
      const bounds = L.latLngBounds(
        locatedRiders.map((r) => [r.current_lat!, r.current_lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [locatedRiders, onRiderClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
      {locatedRiders.length === 0 && (
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
