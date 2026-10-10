"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { startLocationTracking, stopLocationTracking } from "@/lib/rider-location-tracker";
import logger from "@/lib/logger";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import type { Order, OrderItem } from "./types";
import type * as Leaflet from "leaflet";

interface ActiveDeliveryViewProps {
  order: Order;
  riderId: string;
  onUpdateItemStatus: (itemId: string, status: string, price?: number) => void;
  onMarkDelivered: () => void;
  onReportIssue: () => void;
  onStartDelivery?: () => void;
  onShareLocation?: () => void;
}

export default function ActiveDeliveryView({
  order,
  riderId,
  onUpdateItemStatus,
  onMarkDelivered,
  onReportIssue,
  onStartDelivery,
  onShareLocation,
}: ActiveDeliveryViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const items = order.items || [];
  const pickedCount = items.filter((i: OrderItem) => i.status === "available").length;
  const totalSpent = items.reduce(
    (s: number, i: OrderItem) => s + (i.actual_price || 0) * i.quantity,
    0
  );
  const profit = (order.total_amount || 0) + (order.delivery_fee || 0) - totalSpent;

  // In new flow: shopping/accepted = rider at store picking items (pickup phase)
  // picked_up/on_the_way = confirmed picked up, heading to customer (delivery phase)
  const phase = ["picked_up", "on_the_way"].includes(order.status) ? "delivery" : "pickup";
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
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      let riderLat = 26.1445,
        riderLng = 91.7362;
      await new Promise<void>((res) => {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            riderLat = p.coords.latitude;
            riderLng = p.coords.longitude;
            res();
          },
          () => res(),
          { timeout: 6000, enableHighAccuracy: true }
        );
      });

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([riderLat, riderLng], 15);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      const riderIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:46px;height:46px">
          <div style="position:absolute;inset:0;background:rgba(11,80,213,0.2);border-radius:50%;animation:pulse-ring 1s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:var(--color-secondary);border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(11,80,213,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>
        </div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 46],
      });
      const riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon, zIndexOffset: 1000 })
        .bindPopup("<b>You</b>")
        .addTo(map);
      riderMarkerRef.current = riderMarker;

      const isPickup = phase === "pickup";
      const destColor = isPickup ? "var(--color-status-success)" : "var(--color-primary)";
      const destEmoji = isPickup ? "🏪" : "🏠";
      const destLabel = isPickup ? "Pick up here" : "Deliver here";
      const destAddr = isPickup ? vendorAddress : deliveryAddress;

      const destIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:44px;height:44px">
          <div style="position:absolute;inset:0;background:${destColor}22;border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:${destColor};border-radius:50%;border:3px solid white;box-shadow:0 4px 12px ${destColor}66;display:flex;align-items:center;justify-content:center;font-size:18px;">${destEmoji}</div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      async function drawRoute(rLat: number, rLng: number, dLat: number, dLng: number) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${rLng},${rLat};${dLng},${dLat}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes?.[0] && isMounted && mapInstanceRef.current) {
            routeLayerRef.current.forEach((l) => map.removeLayer(l));
            routeLayerRef.current = [];
            const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [
              c[1],
              c[0],
            ]);
            const shadow = L.polyline(coords, {
              color: `${destColor}33`,
              weight: 10,
              lineCap: "round",
            }).addTo(map);
            const line = L.polyline(coords, {
              color: destColor,
              weight: 5,
              lineCap: "round",
            }).addTo(map);
            routeLayerRef.current = [shadow, line];
            const eta = Math.round(data.routes[0].duration / 60);
            const dist = (data.routes[0].distance / 1000).toFixed(1);
            if (isMounted) setTrackingInfo({ eta, distance: dist });
            map.fitBounds(
              [
                [rLat, rLng],
                [dLat, dLng],
              ],
              { padding: [40, 40] }
            );
          }
        } catch (e) {
          logger.warn({ err: e }, "Map routing error");
        }
      }

      let geoSuccess = false;
      const searchAddr =
        destAddr ||
        (isPickup && (order.vendor?.shop_name || order.vendor?.name)
          ? order.vendor?.shop_name || order.vendor?.name
          : null);
      if (searchAddr) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddr)}&limit=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "MIIAM/1.0" } }
          );
          const data = await res.json();
          if (data[0] && isMounted) {
            const dLat = parseFloat(data[0].lat);
            const dLng = parseFloat(data[0].lon);
            destLatLngRef.current = [dLat, dLng];
            L.marker([dLat, dLng], { icon: destIcon })
              .bindPopup(
                `<b>${sanitizeHtml(destLabel)}</b><br><span style="font-size:11px">${sanitizeHtml(searchAddr)}</span>`
              )
              .openPopup()
              .addTo(map);
            await drawRoute(riderLat, riderLng, dLat, dLng);
            geoSuccess = true;
          }
        } catch (e) {
          logger.warn({ err: e }, "Map geocoding error");
        }
      }

      // Fallback: use vendor's stored lat/lng for pickup phase
      if (!geoSuccess && isMounted && isPickup && order.vendor?.lat && order.vendor?.lng) {
        const dLat = order.vendor.lat;
        const dLng = order.vendor.lng;
        destLatLngRef.current = [dLat, dLng];
        L.marker([dLat, dLng], { icon: destIcon })
          .bindPopup(
            `<b>${sanitizeHtml(destLabel)}</b><br><span style="font-size:11px">${sanitizeHtml(order.vendor?.shop_name || order.vendor?.name || "Vendor")}</span>`
          )
          .openPopup()
          .addTo(map);
        await drawRoute(riderLat, riderLng, dLat, dLng);
        geoSuccess = true;
      }

      // Fallback: use delivery stored lat/lng for delivery phase
      if (!geoSuccess && isMounted && !isPickup && order.delivery_lat && order.delivery_lng) {
        const dLat = order.delivery_lat;
        const dLng = order.delivery_lng;
        destLatLngRef.current = [dLat, dLng];
        L.marker([dLat, dLng], { icon: destIcon })
          .bindPopup(
            `<b>${sanitizeHtml(destLabel)}</b><br><span style="font-size:11px">${sanitizeHtml(deliveryAddress || "Customer")}</span>`
          )
          .openPopup()
          .addTo(map);
        await drawRoute(riderLat, riderLng, dLat, dLng);
        geoSuccess = true;
      }

      if (!geoSuccess && isMounted) {
        setTrackingInfo({ eta: 0, distance: "0.0" });
      }

      const channel = supabase
        .channel(`rider-loc-${order.id}-${phase}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rider_locations",
            filter: `order_id=eq.${order.id}`,
          },
          async (payload: { new: Record<string, unknown> }) => {
            const loc = payload.new as { lat: number; lng: number };
            if (loc?.lat && loc?.lng && isMounted && mapInstanceRef.current) {
              riderMarkerRef.current?.setLatLng([loc.lat, loc.lng]);
              if (destLatLngRef.current) {
                await drawRoute(
                  loc.lat,
                  loc.lng,
                  destLatLngRef.current[0],
                  destLatLngRef.current[1]
                );
              }
            }
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }

    initMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    showMap,
    phase,
    order.id,
    vendorAddress,
    deliveryAddress,
    order.delivery_lat,
    order.delivery_lng,
  ]);

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-lg">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slide-up { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse order details" : "Expand order details"}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 ${phase === "pickup" ? "bg-gradient-to-r from-green-600 to-emerald-500" : "from-brand-secondary to-accent/70 bg-gradient-to-r"}`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]/20 text-base">
            {phase === "pickup" ? "🏪" : "🏠"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-extrabold text-white">
                {order.vendor?.shop_name || order.vendor?.name || "Order"}
              </p>
              <span className="shrink-0 rounded-full bg-[var(--color-surface-container-lowest)]/10 px-1.5 py-0.5 text-[10px] font-bold text-white/70">
                {phase === "pickup" ? "Pickup" : "Delivery"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-white/80">
              {phase === "pickup" ? vendorAddress : deliveryAddress}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-extrabold text-white">
              ₹{order.total_amount + (order.delivery_fee || 0)}
            </p>
            <p className="text-[9px] font-bold text-white/70">
              {pickedCount}/{items.length} picked
            </p>
          </div>
          <span
            className="material-symbols-outlined text-lg text-white transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ animation: "slide-up 0.25s ease" }}>
          {trackingInfo && (
            <div className="flex border-b border-[var(--color-border-subtle)]">
              <div
                className={`flex-1 border-r border-[var(--color-border-subtle)] py-2 text-center ${phase === "pickup" ? "bg-green-50 dark:bg-green-900/20" : "bg-accent/10 dark:bg-accent/20"}`}
              >
                <p className="text-[9px] font-bold tracking-wide text-[var(--color-outline-variant)] uppercase">
                  ETA
                </p>
                <p
                  className={`text-lg font-black ${phase === "pickup" ? "text-green-600" : "text-brand-secondary"}`}
                >
                  {trackingInfo.eta}
                  <span className="ml-0.5 text-xs font-normal">min</span>
                </p>
              </div>
              <div className="flex-1 py-2 text-center">
                <p className="text-[9px] font-bold tracking-wide text-[var(--color-outline-variant)] uppercase">
                  Distance
                </p>
                <p className="text-lg font-black text-[var(--color-on-surface)]">
                  {trackingInfo.distance}
                  <span className="ml-0.5 text-xs font-normal">km</span>
                </p>
              </div>
              <div className="flex-1 border-l border-[var(--color-border-subtle)] py-2 text-center">
                <p className="text-[9px] font-bold tracking-wide text-[var(--color-outline-variant)] uppercase">
                  GPS
                </p>
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--color-status-success)",
                      display: "inline-block",
                      boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                    }}
                  ></span>
                  <span className="text-[10px] font-bold text-green-600">Live</span>
                </div>
              </div>
            </div>
          )}

          {showMap && (
            <div className="relative">
              <div ref={mapRef} className="w-full" style={{ height: 200 }} />
              {!trackingInfo && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-900/20">
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-container-lowest)] px-4 py-3 shadow-lg">
                    <div className="border-brand-secondary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">
                      Loading route...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 px-4 pt-2 pb-1">
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-brand-secondary bg-accent/10 dark:bg-accent/20 flex items-center gap-1 rounded-lg px-4 py-2.5 text-[10px] font-bold"
            >
              <span className="material-symbols-outlined text-sm">
                {showMap ? "visibility_off" : "map"}
              </span>
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(phase === "pickup" ? vendorAddress : deliveryAddress)}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
              className="bg-brand-secondary flex items-center gap-1 rounded-lg px-4 py-2.5 text-[10px] font-bold text-white"
            >
              <span className="material-symbols-outlined text-sm">navigation</span>
              Google Maps
            </a>
          </div>

          <div className="space-y-1 px-4 py-2">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                {phase === "pickup" ? (
                  <>
                    <div className="mb-1.5">
                      <span className="text-brand-secondary text-[9px] font-bold tracking-wider uppercase">
                        Pickup From
                      </span>
                      <p className="truncate text-xs font-medium text-[var(--color-on-surface)]">
                        {vendorAddress}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold tracking-wider text-[var(--color-outline)] uppercase">
                        Dropoff To
                      </span>
                      <p className="truncate text-[10px] text-[var(--color-outline-variant)]">
                        {deliveryAddress}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mb-1">
                    <span className="text-[9px] font-bold tracking-wider text-green-600 uppercase">
                      Deliver To
                    </span>
                    <p className="truncate text-xs font-bold text-[var(--color-on-surface)]">
                      {deliveryAddress}
                    </p>
                  </div>
                )}
                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-brand-secondary mt-1 flex items-center gap-1 text-[10px] font-semibold"
                  >
                    <span className="material-symbols-outlined text-[10px]">call</span>
                    Call {customerPhone}
                  </a>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--color-surface-subtle)] p-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <div
                  className="bg-status-success h-full transition-all"
                  style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-[var(--color-outline)]">
                {pickedCount}/{items.length} items picked
              </p>
            </div>
          </div>

          <div className="mb-2 max-h-40 space-y-1 overflow-y-auto px-4">
            {items.map((item: OrderItem) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-subtle)] p-2"
              >
                <select
                  value={item.status || "pending"}
                  onChange={(e) =>
                    onUpdateItemStatus(item.id, e.target.value, item.actual_price ?? undefined)
                  }
                  className={`rounded border-0 px-1.5 py-1 text-[10px] font-bold ${
                    item.status === "available"
                      ? "bg-status-success/10 text-status-success"
                      : item.status === "unavailable"
                        ? "bg-status-error/10 text-status-error"
                        : item.status === "different_brand"
                          ? "bg-status-warning/10 text-status-warning"
                          : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="available">✅ Available</option>
                  <option value="unavailable">❌ Unavail</option>
                  <option value="different_brand">🔄 Diff Brand</option>
                </select>
                <span className="flex-1 truncate text-[11px] font-medium">
                  {item.quantity}x {item.menu_item?.name || item.name}
                </span>
                <span className="shrink-0 text-[10px] text-[var(--color-outline-variant)]">
                  ₹{item.unit_price}
                </span>
                {item.status === "available" && (
                  <input
                    type="number"
                    placeholder="Actual"
                    value={item.actual_price || ""}
                    onChange={(e) =>
                      onUpdateItemStatus(item.id, "available", parseFloat(e.target.value))
                    }
                    className="w-14 rounded border border-[var(--color-border-subtle)] bg-white px-1.5 py-1 text-[10px] dark:bg-[var(--color-surface)]"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mb-2 px-4">
            <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-2 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Spent</span>
                <span className="font-bold">₹{totalSpent.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Collect</span>
                <span className="text-brand-secondary font-bold">
                  ₹{order.total_amount + (order.delivery_fee || 0)}
                </span>
              </div>
              <div className="mt-0.5 flex justify-between border-t pt-0.5 text-[11px]">
                <span className="font-bold">Profit</span>
                <span className="font-black text-green-600">₹{profit.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 px-4 pb-4">
            <div className="flex gap-1.5">
              {/* Show "Picked Up — Start Delivery" when in pickup phase and all items accounted for */}
              {phase === "pickup" &&
                pickedCount === items.length &&
                items.length > 0 &&
                onStartDelivery && (
                  <button
                    onClick={onStartDelivery}
                    className="bg-brand-secondary flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white"
                  >
                    <span className="material-symbols-outlined text-sm">directions_bike</span>
                    Picked Up — Start Delivery
                  </button>
                )}
              {phase === "delivery" && onShareLocation && (
                <button
                  onClick={onShareLocation}
                  className="bg-status-success flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white"
                >
                  <span className="material-symbols-outlined text-sm">share_location</span>
                  Share Location
                </button>
              )}
              <button
                onClick={onReportIssue}
                className="bg-status-error/10 text-status-error border-status-error/20 rounded-lg border px-3 py-2 text-[11px] font-bold"
              >
                Report
              </button>
            </div>
            <button
              onClick={onMarkDelivered}
              disabled={phase === "pickup"}
              className="bg-status-success flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              {phase === "delivery"
                ? `Delivered — Collect ₹${(order.total_amount || 0) + (order.delivery_fee || 0)}`
                : `Start delivery to collect ₹${(order.total_amount || 0) + (order.delivery_fee || 0)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
