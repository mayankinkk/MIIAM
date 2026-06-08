"use client";

import { useEffect, useRef } from "react";
import { useCustomerLocation } from "@/lib/hooks/useShareLocation";

interface Props {
  orderId: string | null;
  className?: string;
  height?: number;
}

export default function CustomerLocationView({ orderId, className = "", height = 180 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

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
        <div style="position:absolute;inset:4px;background:#0b50d5;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;">📍</div>
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
          color: "#0b50d5",
          fillColor: "#0b50d5",
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
    <div className={`bg-white rounded-xl border border-outline-variant/30 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            share_location
          </span>
          <span className="text-xs font-bold text-on-surface">Customer Live Location</span>
          {location && (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
          )}
        </div>
        {location && (
          <span className="text-[10px] text-on-surface-variant">
            {new Date(location.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container text-on-surface-variant text-xs">
            Waiting for customer to share...
          </div>
        )}
        {!loading && !location && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container text-on-surface-variant text-xs p-4 text-center">
            <span className="material-symbols-outlined text-2xl text-outline-variant">location_off</span>
            <p className="mt-1">Customer hasn't shared location</p>
            <p className="text-[10px] text-outline">You can ask the customer to share it via chat</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
      </div>
    </div>
  );
}
