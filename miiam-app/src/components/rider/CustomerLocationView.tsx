"use client";

import { useEffect, useRef } from "react";
import { useCustomerLocation } from "@/lib/hooks/useShareLocation";
import type * as Leaflet from "leaflet";

interface Props {
  orderId: string | null;
  className?: string;
  height?: number;
}

export default function CustomerLocationView({ orderId, className = "", height = 180 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const accuracyRef = useRef<Leaflet.Circle | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const { location, loading } = useCustomerLocation({ orderId, enabled: !!orderId });

  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted = true;

    async function init() {
      const L = await import("leaflet");
      leafletRef.current = L;
      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([20.5937, 78.9629], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 300);
    }
    init();
    return () => {
      isMounted = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !location) return;

    const latLng: [number, number] = [location.lat, location.lng];

    const customerIcon = L.divIcon({
      className: "customer-live-pin",
      html: `<div style="position:relative;width:40px;height:40px">
        <div style="position:absolute;inset:0;background:rgba(11,80,213,0.25);border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
        <div style="position:absolute;inset:4px;background:var(--color-secondary);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">📍</div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { icon: customerIcon, zIndexOffset: 1500 }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
    }

    if (location.accuracy) {
      if (!accuracyRef.current) {
        accuracyRef.current = L.circle(latLng, {
          radius: location.accuracy,
          color: "var(--color-secondary)",
          fillColor: "var(--color-secondary)",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      } else {
        accuracyRef.current.setLatLng(latLng);
        accuracyRef.current.setRadius(location.accuracy);
      }
    }

    map.setView(latLng, 17, { animate: true });
  }, [location?.lat, location?.lng, location?.accuracy]);

  if (!orderId) return null;

  return (
    <div
      className={`border-outline-variant/30 overflow-hidden rounded-xl border bg-[var(--color-surface-container-lowest)] ${className}`}
    >
      <div className="border-outline-variant/10 flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-secondary text-base"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            share_location
          </span>
          <span className="text-on-surface text-xs font-bold">Customer Live Location</span>
          {location && (
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
              aria-hidden="true"
            />
          )}
        </div>
        {location && (
          <span className="text-on-surface-variant text-[10px]">
            {new Date(location.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>
      <div className="relative" style={{ height }}>
        <style>{`
          @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
          .customer-live-pin{background:transparent!important;border:0!important;}
          .leaflet-container { width: 100%; height: 100%; margin: 0; padding: 0; }
          .leaflet-container .leaflet-pane > img.leaflet-tile { position: absolute; left: 0; bottom: -1px; }
        `}</style>
        {loading && !location && (
          <div className="bg-surface-container text-on-surface-variant absolute inset-0 z-10 flex items-center justify-center text-xs">
            Waiting for customer to share...
          </div>
        )}
        {!loading && !location && (
          <div className="bg-surface-container text-on-surface-variant absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center text-xs">
            <span className="material-symbols-outlined text-outline-variant text-2xl">
              location_off
            </span>
            <p className="mt-1">Customer hasn't shared location</p>
            <p className="text-outline text-[10px]">
              You can ask the customer to share it via chat
            </p>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" style={{ position: "absolute", inset: 0 }} />
      </div>
    </div>
  );
}
