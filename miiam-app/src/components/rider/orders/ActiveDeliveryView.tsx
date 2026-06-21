"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { startLocationTracking, stopLocationTracking } from "@/lib/rider-location-tracker";
import logger from "@/lib/logger";
import type { Order, OrderItem } from "./types";
import type * as Leaflet from 'leaflet';

interface ActiveDeliveryViewProps {
  order: Order;
  riderId: string;
  onUpdateItemStatus: (itemId: string, status: string, price?: number) => void;
  onMarkDelivered: () => void;
  onReportIssue: () => void;
  onStartDelivery?: () => void;
  onShareLocation?: () => void;
}

export default function ActiveDeliveryView({ order, riderId, onUpdateItemStatus, onMarkDelivered, onReportIssue, onStartDelivery, onShareLocation }: ActiveDeliveryViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const items = order.items || [];
  const pickedCount = items.filter((i: OrderItem) => i.status === "available").length;
  const totalSpent = items.reduce((s: number, i: OrderItem) => s + ((i.actual_price || 0) * i.quantity), 0);
  const profit = (order.total_amount || 0) + (order.delivery_fee || 0) - totalSpent;

  const phase = order.status === "on_the_way" ? "delivery" : "pickup";
  const [expanded, setExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const riderMarkerRef = useRef<Leaflet.Marker | null>(null);
  const routeLayerRef = useRef<Leaflet.Polyline[]>([]);
  const destLatLngRef = useRef<[number, number] | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string } | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const prevPhaseRef = useRef(phase);

  const deliveryAddress = order.delivery_address || order.address?.street || "";
  const vendorAddress = order.vendor?.address || "";
  const customerPhone = order.customer_phone || "";

  useEffect(() => {
    if (riderId) {
      startLocationTracking(riderId, order.id);
    }
    return () => {
      stopLocationTracking();
    };
  }, [order.id, riderId]);

  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        riderMarkerRef.current = null;
        routeLayerRef.current = [];
        destLatLngRef.current = null;
        setTrackingInfo(null);
      }
    }
  }, [phase]);

  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstanceRef.current) return;
    let isMounted = true;

    async function initMap() {
      if (!isMounted || !mapRef.current) return;
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      let riderLat = 26.1445, riderLng = 91.7362;
      await new Promise<void>((res) => {
        navigator.geolocation.getCurrentPosition(
          (p) => { riderLat = p.coords.latitude; riderLng = p.coords.longitude; res(); },
          () => res(), { timeout: 6000, enableHighAccuracy: true }
        );
      });

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([riderLat, riderLng], 15);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      const riderIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:46px;height:46px">
          <div style="position:absolute;inset:0;background:rgba(11,80,213,0.2);border-radius:50%;animation:pulse-ring 1s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:var(--color-secondary);border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(11,80,213,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>
        </div>`,
        iconSize: [46, 46], iconAnchor: [23, 46],
      });
      const riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon, zIndexOffset: 1000 })
        .bindPopup('<b>You</b>').addTo(map);
      riderMarkerRef.current = riderMarker;

      const isPickup = phase === "pickup";
      const destColor = isPickup ? "var(--color-status-success)" : "var(--color-primary)";
      const destEmoji = isPickup ? "🏪" : "🏠";
      const destLabel = isPickup ? "Pick up here" : "Deliver here";
      const destAddr = isPickup ? vendorAddress : deliveryAddress;

      const destIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:44px;height:44px">
          <div style="position:absolute;inset:0;background:${destColor}22;border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:${destColor};border-radius:50%;border:3px solid white;box-shadow:0 4px 12px ${destColor}66;display:flex;align-items:center;justify-content:center;font-size:18px;">${destEmoji}</div>
        </div>`,
        iconSize: [44, 44], iconAnchor: [22, 44],
      });

      async function drawRoute(rLat: number, rLng: number, dLat: number, dLng: number) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${rLng},${rLat};${dLng},${dLat}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes?.[0] && isMounted && mapInstanceRef.current) {
            routeLayerRef.current.forEach(l => map.removeLayer(l));
            routeLayerRef.current = [];
            const coords = data.routes[0].geometry.coordinates.map((c: [number,number]) => [c[1], c[0]]);
            const shadow = L.polyline(coords, { color: `${destColor}33`, weight: 10, lineCap: 'round' }).addTo(map);
            const line = L.polyline(coords, { color: destColor, weight: 5, lineCap: 'round' }).addTo(map);
            routeLayerRef.current = [shadow, line];
            const eta = Math.round(data.routes[0].duration / 60);
            const dist = (data.routes[0].distance / 1000).toFixed(1);
            if (isMounted) setTrackingInfo({ eta, distance: dist });
            map.fitBounds([[rLat, rLng], [dLat, dLng]], { padding: [40, 40] });
          }
        } catch (e) { logger.warn({ err: e }, "Map routing error"); }
      }

      let geoSuccess = false;
      const searchAddr = destAddr || (isPickup && order.vendor?.name ? order.vendor.name : null);
      if (searchAddr) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddr)}&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'MIIAM/1.0' } }
          );
          const data = await res.json();
          if (data[0] && isMounted) {
            const dLat = parseFloat(data[0].lat);
            const dLng = parseFloat(data[0].lon);
            destLatLngRef.current = [dLat, dLng];
            L.marker([dLat, dLng], { icon: destIcon })
              .bindPopup(`<b>${destLabel}</b><br><span style="font-size:11px">${searchAddr}</span>`)
              .openPopup().addTo(map);
            await drawRoute(riderLat, riderLng, dLat, dLng);
            geoSuccess = true;
          }
        } catch (e) { logger.warn({ err: e }, "Map routing error"); }
      }

      if (!geoSuccess && isMounted) {
        setTrackingInfo({ eta: 0, distance: "0.0" });
      }

      const channel = supabase.channel(`rider-loc-${order.id}-${phase}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_locations', filter: `order_id=eq.${order.id}` },
          async (payload: { new: Record<string, unknown> }) => {
            const loc = payload.new as { lat: number; lng: number };
            if (loc?.lat && loc?.lng && isMounted && mapInstanceRef.current) {
              riderMarkerRef.current?.setLatLng([loc.lat, loc.lng]);
              if (destLatLngRef.current) {
                await drawRoute(loc.lat, loc.lng, destLatLngRef.current[0], destLatLngRef.current[1]);
              }
            }
          }).subscribe();

      return () => { isMounted = false; supabase.removeChannel(channel); };
    }

    initMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [showMap, phase, order.id, vendorAddress, deliveryAddress]);

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-lg overflow-hidden">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slide-up { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <button onClick={() => setExpanded(!expanded)} className="w-full text-left" aria-expanded={expanded} aria-label={expanded ? "Collapse order details" : "Expand order details"}>
        <div className={`px-4 py-3 flex items-center gap-3 ${phase === "pickup" ? "bg-gradient-to-r from-green-600 to-emerald-500" : "bg-gradient-to-r from-brand-secondary to-indigo-600"}`}>
          <div className="w-9 h-9 bg-[var(--color-surface-container-lowest)]/20 rounded-full flex items-center justify-center text-base flex-shrink-0">
            {phase === "pickup" ? "🏪" : "🏠"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-extrabold text-xs truncate">{order.vendor?.name || "Order"}</p>
              <span className="text-[10px] text-white/70 font-bold bg-[var(--color-surface-container-lowest)]/10 px-1.5 py-0.5 rounded-full shrink-0">{phase === "pickup" ? "Pickup" : "Delivery"}</span>
            </div>
            <p className="text-white/80 text-[10px] truncate mt-0.5">
              {phase === "pickup" ? vendorAddress : deliveryAddress}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-extrabold text-sm">₹{order.total_amount + (order.delivery_fee || 0)}</p>
            <p className="text-[9px] text-white/70 font-bold">{pickedCount}/{items.length} picked</p>
          </div>
          <span className="material-symbols-outlined text-white text-lg transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ animation: 'slide-up 0.25s ease' }}>
          {trackingInfo && (
            <div className="flex border-b border-[var(--color-border-subtle)]">
              <div className={`flex-1 py-2 text-center border-r border-[var(--color-border-subtle)] ${phase === "pickup" ? "bg-green-50 dark:bg-green-900/20" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">ETA</p>
                <p className={`text-lg font-black ${phase === "pickup" ? "text-green-600" : "text-brand-secondary"}`}>
                  {trackingInfo.eta}<span className="text-xs font-normal ml-0.5">min</span>
                </p>
              </div>
              <div className="flex-1 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">Distance</p>
                <p className="text-lg font-black text-[var(--color-on-surface)]">{trackingInfo.distance}<span className="text-xs font-normal ml-0.5">km</span></p>
              </div>
              <div className="flex-1 py-2 text-center border-l border-[var(--color-border-subtle)]">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">GPS</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--color-status-success)',display:'inline-block',boxShadow:'0 0 0 2px rgba(34,197,94,0.25)'}}></span>
                  <span className="text-[10px] font-bold text-green-600">Live</span>
                </div>
              </div>
            </div>
          )}

          {showMap && (
            <div className="relative">
              <div ref={mapRef} className="w-full" style={{ height: 200 }} />
              {!trackingInfo && (
                <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-[400]">
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
                    <div className="w-4 h-4 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin"/>
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">Loading route...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="px-4 pt-2 pb-1 flex gap-2">
            <button onClick={() => setShowMap(!showMap)} className="text-[10px] font-bold text-brand-secondary bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">{showMap ? "visibility_off" : "map"}</span>
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(phase === "pickup" ? vendorAddress : deliveryAddress)}&travelmode=driving`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white bg-brand-secondary px-4 py-2.5 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">navigation</span>
              Google Maps
            </a>
          </div>

          <div className="px-4 py-2 space-y-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-outline-variant)] truncate">{order.vendor?.address}</p>
                <p className="text-[10px] text-[var(--color-primary)] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[10px]">location_on</span>
                  <span className="truncate">{deliveryAddress}</span>
                </p>
                {customerPhone && (
                  <a href={`tel:${customerPhone}`} className="text-[10px] text-brand-secondary font-semibold flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[10px]">call</span>
                    Call {customerPhone}
                  </a>
                )}
              </div>
            </div>
            <div className="bg-[var(--color-surface-subtle)] rounded-lg p-2">
              <div className="bg-[var(--color-surface-container-high)] rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-[var(--color-outline)] mt-1">{pickedCount}/{items.length} items picked</p>
            </div>
          </div>

          <div className="px-4 space-y-1 mb-2 max-h-40 overflow-y-auto">
            {items.map((item: OrderItem) => (
              <div key={item.id} className="flex items-center gap-1.5 p-2 bg-[var(--color-surface-subtle)] rounded-lg">
                <select
                  value={item.status || "pending"}
                  onChange={(e) => onUpdateItemStatus(item.id, e.target.value, item.actual_price ?? undefined)}
                  className={`text-[10px] font-bold px-1.5 py-1 rounded border-0 ${
                    item.status === "available" ? "bg-green-100 text-green-700" :
                    item.status === "unavailable" ? "bg-red-100 text-red-700" :
                    item.status === "different_brand" ? "bg-amber-100 text-amber-700" :
                    "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="available">✅ Available</option>
                  <option value="unavailable">❌ Unavail</option>
                  <option value="different_brand">🔄 Diff Brand</option>
                </select>
                <span className="flex-1 text-[11px] font-medium truncate">{item.quantity}x {item.menu_item?.name || item.name}</span>
                <span className="text-[10px] text-[var(--color-outline-variant)] shrink-0">₹{item.unit_price}</span>
                {item.status === "available" && (
                  <input
                    type="number"
                    placeholder="Actual"
                    value={item.actual_price || ""}
                    onChange={(e) => onUpdateItemStatus(item.id, "available", parseFloat(e.target.value))}
                    className="w-14 text-[10px] border border-[var(--color-border-subtle)] rounded px-1.5 py-1 bg-white dark:bg-[var(--color-surface)]"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="px-4 mb-2">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-2 rounded-lg">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Spent</span>
                <span className="font-bold">₹{totalSpent.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Collect</span>
                <span className="font-bold text-brand-secondary">₹{order.total_amount + (order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-[11px] border-t pt-0.5 mt-0.5">
                <span className="font-bold">Profit</span>
                <span className="font-black text-green-600">₹{profit.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-1.5">
            <div className="flex gap-1.5">
              {pickedCount === items.length && items.length > 0 && onStartDelivery && order.status !== "on_the_way" && (
                <button onClick={onStartDelivery} className="flex-1 py-2 bg-brand-secondary text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">directions_bike</span>
                  Start Delivery
                </button>
              )}
              {order.status === "on_the_way" && onShareLocation && (
                <button onClick={onShareLocation} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">share_location</span>
                  Share Location
                </button>
              )}
              <button onClick={onReportIssue} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold border border-red-100">
                Report
              </button>
            </div>
            <button onClick={onMarkDelivered} disabled={pickedCount === 0} className="w-full bg-green-500 text-white py-2.5 rounded-lg font-bold disabled:opacity-40 flex items-center justify-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-sm">payments</span>
              Complete & Collect ₹{(order.total_amount || 0) + (order.delivery_fee || 0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
