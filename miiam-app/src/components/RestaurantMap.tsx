"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface RestaurantMapProps {
  restaurants: Array<{
    id: string;
    shop_name: string;
    rating?: string | number;
    cuisine?: string;
    image_url?: string;
    latitude?: number;
    longitude?: number;
  }>;
  center?: [number, number];
  zoom?: number;
  onRestaurantClick?: (id: string) => void;
}

export default function RestaurantMap({
  restaurants,
  center = [20.5937, 78.9629],
  zoom = 12,
  onRestaurantClick,
}: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      restaurants.forEach((r) => {
        if (!r.latitude || !r.longitude) return;

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background:var(--color-primary,#16a34a);color:white;border-radius:12px;padding:4px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white;transform:translate(-50%,-100%);cursor:pointer">${r.shop_name}${r.rating ? ` ★${r.rating}` : ""}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker([r.latitude, r.longitude], { icon })
          .addTo(map)
          .on("click", () => onRestaurantClick?.(r.id));
      });

      mapInstance.current = map;
    };

    init();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [restaurants, center, zoom, onRestaurantClick]);

  return (
    <div
      ref={mapRef}
      className="w-full h-72 rounded-2xl overflow-hidden bg-surface-container"
    />
  );
}
