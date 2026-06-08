"use client";

import { useEffect, useRef, useState } from "react";

export interface RiderLocation {
  lat: number;
  lng: number;
  bearing?: number;
  updatedAt?: string;
}

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  kind?: "home" | "vendor" | "rider" | "pickup";
}

export interface RiderMapHandle {
  setRider: (loc: RiderLocation | null) => void;
}

export interface RouteLeg {
  from: MapPoint;
  to: MapPoint;
  color?: string;
  dashed?: boolean;
}

interface Props {
  pickup?: MapPoint | null;
  dropoff: MapPoint;
  riderLocation?: RiderLocation | null;
  showRoute?: boolean;
  showBearing?: boolean;
  onRouteUpdate?: (info: { eta: number; distance: string; leg: "to_pickup" | "to_drop" }) => void;
  className?: string;
  height?: number | string;
}

const OSRM = "https://router.project-osrm.org/route/v1/driving";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const q = address.toLowerCase().includes("india") ? address : `${address}, India`;
    const res = await fetch(
      `${NOMINATIM}?format=json&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data[0]) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (_) {
    // fall through
  }
  return null;
}

async function routeBetween(
  from: [number, number],
  to: [number, number]
): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  try {
    const res = await fetch(
      `${OSRM}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.[0]) {
      const coords = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      );
      return {
        coords,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
      };
    }
  } catch (_) {
    // fall through
  }
  return null;
}

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function bearing(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const homeIconHtml = `
  <div style="position:relative;width:44px;height:44px">
    <div style="position:absolute;inset:0;background:rgba(186,0,28,0.15);border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
    <div style="position:absolute;inset:4px;background:#ba001c;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">🏠</div>
  </div>`;

const vendorIconHtml = `
  <div style="position:relative;width:44px;height:44px">
    <div style="position:absolute;inset:0;background:rgba(11,80,213,0.15);border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
    <div style="position:absolute;inset:4px;background:#0b50d5;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">🍽️</div>
  </div>`;

export default function RiderMap({
  pickup,
  dropoff,
  riderLocation,
  showRoute = true,
  showBearing = true,
  onRouteUpdate,
  className = "",
  height = "100%",
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const homeMarkerRef = useRef<any>(null);
  const vendorMarkerRef = useRef<any>(null);
  const trailLayerRef = useRef<any | null>(null);
  const trailPointsRef = useRef<[number, number][]>([]);
  const routeLayerRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const dropoffCoordRef = useRef<[number, number] | null>(null);
  const pickupCoordRef = useRef<[number, number] | null>(null);
  const lastBearingRef = useRef<number>(0);
  const lastRiderPosRef = useRef<[number, number] | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const TRAIL_MAX = 30;
  const [resolvedDropoff, setResolvedDropoff] = useState<[number, number] | null>(null);
  const [resolvedPickup, setResolvedPickup] = useState<[number, number] | null>(null);

  // Mount the map
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
      }).setView([28.6139, 77.209], 13);

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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Geocode addresses
  useEffect(() => {
    let cancelled = false;
    async function resolveAll() {
      const drop = await geocode(dropoff.label || "");
      if (cancelled) return;
      if (drop) {
        dropoffCoordRef.current = drop;
        setResolvedDropoff(drop);
      } else if (dropoff.lat && dropoff.lng) {
        const c: [number, number] = [dropoff.lat, dropoff.lng];
        dropoffCoordRef.current = c;
        setResolvedDropoff(c);
      }
      if (pickup?.label) {
        const pick = await geocode(pickup.label);
        if (cancelled) return;
        if (pick) {
          pickupCoordRef.current = pick;
          setResolvedPickup(pick);
        }
      } else if (pickup?.lat && pickup?.lng) {
        const c: [number, number] = [pickup.lat, pickup.lng];
        pickupCoordRef.current = c;
        setResolvedPickup(c);
      }
    }
    resolveAll();
    return () => { cancelled = true; };
  }, [dropoff.label, dropoff.lat, dropoff.lng, pickup?.label, pickup?.lat, pickup?.lng]);

  // Place / update static markers (home, vendor)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const drop = dropoffCoordRef.current;
    if (drop && !homeMarkerRef.current) {
      homeMarkerRef.current = L.marker(drop, {
        icon: L.divIcon({ className: "", html: homeIconHtml, iconSize: [44, 44], iconAnchor: [22, 44] }),
        zIndexOffset: 500,
      })
        .bindPopup("Your delivery location")
        .addTo(map);
    } else if (drop && homeMarkerRef.current) {
      homeMarkerRef.current.setLatLng(drop);
    }

    const pick = pickupCoordRef.current;
    if (pick && !vendorMarkerRef.current) {
      vendorMarkerRef.current = L.marker(pick, {
        icon: L.divIcon({ className: "", html: vendorIconHtml, iconSize: [44, 44], iconAnchor: [22, 44] }),
        zIndexOffset: 500,
      })
        .bindPopup("Pickup location")
        .addTo(map);
    } else if (pick && vendorMarkerRef.current) {
      vendorMarkerRef.current.setLatLng(pick);
    }

    // Fit bounds once we have at least one
    if (drop || pick) {
      const pts: [number, number][] = [];
      if (drop) pts.push(drop);
      if (pick) pts.push(pick);
      if (pts.length === 1) {
        map.setView(pts[0], 15, { animate: true });
      } else {
        map.fitBounds(pts as any, { padding: [60, 60] });
      }
    }
  }, [resolvedDropoff, resolvedPickup]);

  // Draw the route whenever the rider, pickup, or drop change
  useEffect(() => {
    if (!showRoute) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    let cancelled = false;
    async function draw() {
      if (!mapInstanceRef.current) return;
      const drop = dropoffCoordRef.current;
      const pick = pickupCoordRef.current;
      const rider = riderLocation;

      // Remove old route layers
      routeLayerRef.current.forEach((l) => map.removeLayer(l));
      routeLayerRef.current = [];

      const drawLeg = async (from: [number, number], to: [number, number], opts: { dashed?: boolean; leg: "to_pickup" | "to_drop" }) => {
        if (cancelled) return;
        const r = await routeBetween(from, to);
        if (cancelled || !r || !mapInstanceRef.current) return;
        const m = mapInstanceRef.current;
        const baseColor = opts.leg === "to_pickup" ? "#0b50d5" : "#ba001c";
        const shadow = L.polyline(r.coords, {
          color: `${baseColor}33`,
          weight: 10,
          lineCap: "round",
        }).addTo(m);
        const line = L.polyline(r.coords, {
          color: baseColor,
          weight: 5,
          lineCap: "round",
          dashArray: opts.dashed ? "6,8" : undefined,
        }).addTo(m);
        routeLayerRef.current.push(shadow, line);
        if (onRouteUpdate) {
          onRouteUpdate({
            eta: Math.round(r.duration / 60),
            distance: (r.distance / 1000).toFixed(1),
            leg: opts.leg,
          });
        }
      };

      if (rider) {
        // Two-leg route: rider -> pickup (if exists) -> drop
        if (pick) {
          await drawLeg([rider.lat, rider.lng], pick, { dashed: true, leg: "to_pickup" });
          if (!cancelled && drop) {
            await drawLeg(pick, drop, { dashed: false, leg: "to_drop" });
          }
        } else if (drop) {
          await drawLeg([rider.lat, rider.lng], drop, { dashed: false, leg: "to_drop" });
        }
      } else if (pick && drop) {
        // No rider yet — show pickup -> drop as a static line
        await drawLeg(pick, drop, { dashed: true, leg: "to_drop" });
      }
    }

    draw();
    return () => { cancelled = true; };
  }, [riderLocation?.lat, riderLocation?.lng, resolvedDropoff, resolvedPickup, showRoute]);

  // Update the rider marker — and animate smoothly between positions
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !riderLocation) return;

    if (!riderMarkerRef.current) {
      const riderIcon = L.divIcon({
        className: "rider-marker",
        html: `<div id="rider-anchor" style="position:relative;width:46px;height:46px;transform:translate(-23px,-23px);">
          <div id="rider-pulse" style="position:absolute;inset:0;background:rgba(255,215,9,0.25);border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
          <div id="rider-orbit" style="position:absolute;inset:0;offset-path:path('M 23 8 A 15 15 0 1 1 22.99 8');offset-rotate:0deg;animation:orbit-dot 1.8s linear infinite;">
            <span style="display:block;width:6px;height:6px;background:#ffd709;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);margin-left:20px;margin-top:-3px;"></span>
          </div>
          <div id="rider-scooter" style="position:absolute;inset:4px;background:#ffd709;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;transform-origin:center;transition:transform 1.2s linear;">🛵</div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], {
        icon: riderIcon,
        zIndexOffset: 1000,
      })
        .bindPopup("Rider")
        .addTo(map);
      lastRiderPosRef.current = [riderLocation.lat, riderLocation.lng];
    }

    const marker = riderMarkerRef.current;
    const currentLatLng = marker.getLatLng();
    const from: [number, number] = [currentLatLng.lat, currentLatLng.lng];
    const to: [number, number] = [riderLocation.lat, riderLocation.lng];
    const distance = haversine(from, to);

    // Update bearing
    if (showBearing && distance > 0.005) {
      const b = bearing(from, to);
      // Avoid spinning
      let delta = b - lastBearingRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastBearingRef.current = (lastBearingRef.current + delta + 360) % 360;
      const el = marker.getElement()?.querySelector("#rider-scooter") as HTMLElement | null;
      if (el) {
        el.style.transform = `rotate(${lastBearingRef.current}deg)`;
      }
    }

    // Animate the marker to the new position over a distance-proportional
    // duration (1.2s base, capped at 4s for very long hops).
    const baseMs = 1200;
    const dur = Math.min(4000, Math.max(600, baseMs + distance * 200));
    const start = performance.now();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      const lat = from[0] + (to[0] - from[0]) * ease;
      const lng = from[1] + (to[1] - from[1]) * ease;
      marker.setLatLng([lat, lng]);

      // Append to trail every few frames
      if (!trailPointsRef.current.length || haversine(trailPointsRef.current[trailPointsRef.current.length - 1], [lat, lng]) > 0.005) {
        trailPointsRef.current.push([lat, lng]);
        if (trailPointsRef.current.length > TRAIL_MAX) trailPointsRef.current.shift();
        if (trailLayerRef.current) trailLayerRef.current.remove();
        if (trailPointsRef.current.length >= 2) {
          trailLayerRef.current = L.polyline(trailPointsRef.current, {
            color: "#ffd709",
            weight: 4,
            opacity: 0.7,
            lineCap: "round",
          }).addTo(map);
        }
      }
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        lastRiderPosRef.current = [lat, lng];
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [riderLocation?.lat, riderLocation?.lng, showBearing]);

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        .rider-marker { background: transparent !important; border: 0 !important; }
        @keyframes orbit-dot { 0% { offset-distance: 0%; opacity: 1; } 80% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
        .leaflet-container { width: 100%; height: 100%; margin: 0; padding: 0; }
        .leaflet-container .leaflet-pane > img.leaflet-tile { position: absolute; left: 0; bottom: -1px; }
      `}</style>
      <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
      <div ref={mapRef} className="w-full h-full" style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
