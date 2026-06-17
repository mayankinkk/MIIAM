"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Rider } from "@/lib/types";

interface RiderLocation {
  order_id: string;
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  lat: number;
  lng: number;
  created_at: string;
}

interface LeafletMapInstance {
  setView(center: [number, number], zoom: number): LeafletMapInstance;
  invalidateSize(): void;
  remove(): void;
  removeLayer(layer: unknown): void;
  fitBounds(bounds: unknown, options?: { padding?: [number, number]; maxZoom?: number }): void;
}

interface LeafletCircleMarkerInstance {
  getLatLng(): { lat: number; lng: number };
  setLatLng(latlng: [number, number]): LeafletCircleMarkerInstance;
  bindPopup(content: string): LeafletCircleMarkerInstance;
  addTo(map: LeafletMapInstance): LeafletCircleMarkerInstance;
  on(event: string, handler: () => void): LeafletCircleMarkerInstance;
}

interface LeafletLatLngInstance {
  lat: number;
  lng: number;
}

interface LeafletModule {
  map(el: HTMLElement, options?: Record<string, unknown>): LeafletMapInstance;
  control: { zoom(options?: Record<string, unknown>): { addTo(map: LeafletMapInstance): void } };
  tileLayer(url: string, options?: Record<string, unknown>): { addTo(map: LeafletMapInstance): void };
  circleMarker(latlng: [number, number], options?: Record<string, unknown>): LeafletCircleMarkerInstance;
  latLngBounds(bounds: [number, number][]): { contains(latlng: [number, number]): boolean };
  latLng(latlng: [number, number]): LeafletLatLngInstance;
}

interface Props {
  riders: Rider[];
  onRiderClick: (rider: Rider) => void;
}

export default function AdminRiderMap({ riders, onRiderClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markersRef = useRef<Map<string, LeafletCircleMarkerInstance>>(new Map());
  const leafletRef = useRef<LeafletModule | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Build a lookup of latest location per rider_id
  const locationMap = useMemo(() => {
    const map = new Map<string, RiderLocation>();
    for (const loc of riderLocations) {
      const existing = map.get(loc.rider_id);
      if (!existing || new Date(loc.created_at) > new Date(existing.created_at)) {
        map.set(loc.rider_id, loc);
      }
    }
    return map;
  }, [riderLocations]);

  // Riders that have valid coordinates from rider_locations table
  const locatedRiders = useMemo(() => {
    return riders.filter((r) => {
      const loc = locationMap.get(r.id);
      return loc && loc.lat && loc.lng && loc.lat !== 0 && loc.lng !== 0;
    });
  }, [riders, locationMap]);

  // Merge rider info with location
  const ridersWithCoords = useMemo(() => {
    return locatedRiders.map((r) => {
      const loc = locationMap.get(r.id)!;
      return { ...r, _lat: loc.lat, _lng: loc.lng, _phone: loc.rider_phone };
    });
  }, [locatedRiders, locationMap]);

  // Fetch rider locations from API route (bypasses RLS)
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/admin/riders/locations");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setFetchError(`HTTP ${res.status}: ${body.error || res.statusText}`);
          return;
        }
        const data = await res.json();
        setRiderLocations(data);
      } catch (e: unknown) {
        setFetchError(e instanceof Error ? e.message : "Unknown error");
      }
    }
    fetchLocations();

    // Poll every 5 seconds
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

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

    const currentIds = new Set(ridersWithCoords.map((r) => r.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    for (const rider of ridersWithCoords) {
      const pos: [number, number] = [rider._lat, rider._lng];

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
    if (ridersWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        ridersWithCoords.map((r) => [r._lat, r._lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [ridersWithCoords, onRiderClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
      {fetchError && (
        <div className="absolute top-2 left-2 right-2 z-[999] bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600">
          Location fetch error: {fetchError}
        </div>
      )}
      {locatedRiders.length === 0 && !fetchError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-subtle)]/80 pointer-events-none z-[999]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60 mb-2">location_off</span>
            <p className="text-sm font-bold text-[var(--color-outline-variant)]">No rider locations yet</p>
            <p className="text-xs text-[var(--color-outline-variant)]/60">Riders will appear here when they start delivering</p>
          </div>
        </div>
      )}
      {fetchError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-subtle)]/80 pointer-events-none z-[998]">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-red-300 mb-2">error</span>
            <p className="text-sm font-bold text-red-400">Failed to load rider locations</p>
            <p className="text-xs text-red-300">Check Supabase table permissions</p>
          </div>
        </div>
      )}
    </div>
  );
}
