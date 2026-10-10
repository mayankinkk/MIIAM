"use client";

import { useState, useEffect, useRef } from "react";
import { reverseGeocode, searchLocation } from "@/lib/geocoding";
import { multiShotDetectWithFallback } from "@/lib/location-detection";

export interface SelectedAddress {
  label: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  flat?: string;
  landmark?: string;
  instructions?: string;
  lat?: number;
  lng?: number;
  type?: string;
  phone?: string;
  phone_verified?: boolean;
}

interface Props {
  onSelect: (addr: SelectedAddress) => void;
  onClose: () => void;
  savedAddresses?: SelectedAddress[];
}

const ADDRESS_TYPES = [
  { id: "home", icon: "home", label: "Home" },
  { id: "office", icon: "business", label: "Office" },
  { id: "other", icon: "place", label: "Other" },
];

interface NominatimSuggestion {
  place_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
  [key: string]: unknown;
}

interface LeafletMapInstance {
  setView(center: [number, number], zoom: number): LeafletMapInstance;
  invalidateSize(): void;
  remove(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMarkerInstance = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletModule = Record<string, any>;

export default function AddressPickerSheet({ onSelect, onClose, savedAddresses = [] }: Props) {
  const [tab, setTab] = useState<"saved" | "gps" | "manual">(
    savedAddresses.length > 0 ? "saved" : "gps"
  );

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<"idle" | "detecting" | "detected" | "error">("idle");
  const [gpsAddress, setGpsAddress] = useState<SelectedAddress | null>(null);
  const [gpsError, setGpsError] = useState("");

  // Manual state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    lat: number;
    lng: number;
    display: string;
  } | null>(null);
  const [flat, setFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [addrType, setAddrType] = useState("home");
  const [phone, setPhone] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarkerInstance | null>(null);

  // GPS detection + reverse geocode with multi-shot accuracy
  async function detectGPS() {
    setGpsStatus("detecting");
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Location not supported by your browser.");
      setGpsStatus("error");
      return;
    }
    try {
      const result = await multiShotDetectWithFallback(3);
      const { lat, lng, accuracy } = result;
      try {
        const geo = await reverseGeocode(lat, lng, accuracy);
        setGpsAddress({
          label: "Current Location",
          street: geo.displayAddress,
          city: geo.city || "Unknown",
          state: geo.state,
          postal_code: geo.postalCode,
          lat,
          lng,
          type: "other",
        });
      } catch {
        setGpsAddress({
          label: "Current Location",
          street: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: "Unknown",
          state: "",
          postal_code: "000000",
          lat,
          lng,
          type: "other",
        });
      }
      setGpsStatus("detected");
    } catch {
      setGpsError("Could not detect location. Please allow location access.");
      setGpsStatus("error");
    }
  }

  // Nominatim search autocomplete
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchLocation(searchQuery, 6);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
      setSearchLoading(false);
    }, 400);
  }, [searchQuery]);

  // Init map once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;

      const initialLoc = pickedLocation || { lat: 28.6139, lng: 77.209 };
      const map = L.map(mapRef.current, { zoomControl: false }).setView(
        [initialLoc.lat, initialLoc.lng],
        16
      );
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:40px;background:var(--color-primary);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(248,203,70,0.4)"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([initialLoc.lat, initialLoc.lng], { icon, draggable: true }).addTo(
        map
      );
      markerRef.current = marker;
      mapInstanceRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 300);

      marker.on("dragend", async (e: unknown) => {
        const target = (e as { target: { getLatLng: () => { lat: number; lng: number } } }).target;
        const { lat, lng } = target.getLatLng();
        try {
          const geo = await reverseGeocode(lat, lng);
          setPickedLocation({ lat, lng, display: geo.displayAddress });
        } catch {
          setPickedLocation((prev) => (prev ? { ...prev, lat, lng } : null));
        }
      });
    })();
    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function pickSuggestion(s: NominatimSuggestion) {
    const addr = s.address || {};
    setPickedLocation({
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
      display: s.display_name,
    });
    setSearchQuery(s.display_name.split(",")[0]);
    setSuggestions([]);
    // Pre-fill fields
  }

  function confirmManual() {
    if (!pickedLocation) return;
    const parts = pickedLocation.display.split(",");
    const rawPostal = parts[parts.length - 2]?.trim() || "";
    onSelect({
      label: addrType === "home" ? "Home" : addrType === "office" ? "Office" : "Other",
      street: [flat, parts[0]].filter(Boolean).join(", "),
      city: parts[1]?.trim() || "",
      state: parts[2]?.trim() || "",
      postal_code: rawPostal.length >= 4 ? rawPostal : "000000",
      flat,
      landmark,
      instructions,
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      type: addrType,
      phone,
    });
  }

  return (
    <>
      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .addr-sheet { animation: sheet-up 0.3s cubic-bezier(0.32,0.72,0,1); }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="addr-sheet fixed right-0 bottom-0 left-0 z-[201] flex max-h-[92vh] flex-col rounded-t-3xl bg-[var(--color-surface-container-lowest)] shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Handle + Header */}
        <div className="flex-shrink-0 border-b border-[var(--color-border-subtle)] px-5 pt-4 pb-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[var(--color-on-surface)]">
              Choose Delivery Location
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
            >
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                close
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            {savedAddresses.length > 0 && (
              <button
                onClick={() => setTab("saved")}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${tab === "saved" ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
              >
                📋 Saved
              </button>
            )}
            <button
              onClick={() => {
                setTab("gps");
                if (gpsStatus === "idle") detectGPS();
              }}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${tab === "gps" ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
            >
              📍 Use GPS
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${tab === "manual" ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
            >
              ✏️ Enter Manually
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── SAVED TAB ── */}
          {tab === "saved" && (
            <div className="space-y-3 p-5">
              {savedAddresses.map((addr, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(addr)}
                  className="flex w-full items-start gap-4 rounded-2xl border-2 border-transparent bg-[var(--color-surface-subtle)] p-4 text-left transition-all hover:border-[var(--color-primary)]"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                    <span className="material-symbols-outlined text-[var(--color-accent)]">
                      {addr.type === "office"
                        ? "business"
                        : addr.type === "other"
                          ? "place"
                          : "home"}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-on-surface)]">{addr.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-outline)]">
                      {addr.street}, {addr.city}
                    </p>
                  </div>
                  <span className="material-symbols-outlined mt-1 ml-auto text-[var(--color-outline-variant)]">
                    chevron_right
                  </span>
                </button>
              ))}
              <button
                onClick={() => setTab("gps")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-primary)]/30 p-4 font-bold text-[var(--color-accent)] hover:bg-[var(--color-surface-container-lowest)]"
              >
                <span className="material-symbols-outlined">add_location</span>
                Add New Address
              </button>
            </div>
          )}

          {/* ── GPS TAB ── */}
          {tab === "gps" && (
            <div className="p-5">
              {gpsStatus === "idle" && (
                <button
                  onClick={detectGPS}
                  className="bg-primary text-on-primary flex w-full flex-col items-center gap-3 rounded-xl py-5 font-extrabold shadow-md transition-all hover:brightness-95"
                >
                  <span className="material-symbols-outlined text-4xl">my_location</span>
                  <span>Detect My Location</span>
                  <span className="text-xs font-normal opacity-80">
                    Quick & accurate GPS detection
                  </span>
                </button>
              )}

              {gpsStatus === "detecting" && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 animate-ping rounded-full border-4 border-[var(--color-primary)]/20" />
                    <div className="absolute inset-3 flex items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                      <span className="material-symbols-outlined text-3xl text-[var(--color-accent)]">
                        location_searching
                      </span>
                    </div>
                  </div>
                  <p className="font-bold text-[var(--color-on-surface)]">
                    Detecting your location...
                  </p>
                  <p className="text-sm text-[var(--color-outline-variant)]">
                    Please allow location access
                  </p>
                </div>
              )}

              {gpsStatus === "error" && (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-red-400">
                    location_off
                  </span>
                  <p className="mt-3 font-bold text-[var(--color-on-surface)]">{gpsError}</p>
                  <button
                    onClick={detectGPS}
                    className="text-on-primary mt-4 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setTab("manual")}
                    className="mt-3 w-full py-3 font-bold text-[var(--color-accent)]"
                  >
                    Enter Address Manually →
                  </button>
                </div>
              )}

              {gpsStatus === "detected" && gpsAddress && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl border-2 border-green-200 bg-green-50 p-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span
                        className="material-symbols-outlined text-green-600"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        location_on
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-green-600 uppercase">
                        📡 GPS Detected
                      </p>
                      <p className="text-sm leading-relaxed font-bold text-[var(--color-on-surface)]">
                        {gpsAddress.street}
                      </p>
                      {gpsAddress.city && (
                        <p className="mt-1 text-sm text-[var(--color-outline)]">
                          {gpsAddress.city}, {gpsAddress.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Flat / Landmark */}
                  <input
                    type="text"
                    placeholder="Flat / House No. / Building *"
                    aria-label="Flat / House number"
                    value={flat}
                    onChange={(e) => setFlat(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nearby Landmark (optional)"
                    aria-label="Nearby landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    aria-label="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                    inputMode="numeric"
                    maxLength={10}
                  />

                  {/* Address type */}
                  <div>
                    <p className="mb-2 text-sm font-bold text-[var(--color-on-surface)]">Save as</p>
                    <div className="flex gap-3">
                      {ADDRESS_TYPES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAddrType(t.id)}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${addrType === t.id ? "border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] text-[var(--color-accent)]" : "border-[var(--color-border-subtle)] text-[var(--color-outline)]"}`}
                        >
                          <span className="material-symbols-outlined text-base">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onSelect({
                        ...gpsAddress!,
                        flat,
                        landmark,
                        instructions,
                        type: addrType,
                        label: addrType.charAt(0).toUpperCase() + addrType.slice(1),
                        phone,
                      })
                    }
                    disabled={!flat.trim() || phone.length !== 10}
                    className="bg-primary text-on-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 font-extrabold shadow-md transition-all hover:brightness-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Confirm This Location
                  </button>

                  <button
                    onClick={detectGPS}
                    className="flex w-full items-center justify-center gap-1 py-3 text-sm font-bold text-[var(--color-outline)]"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Re-detect Location
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <div className="space-y-4 p-5">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-outline-variant)]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search area, street, landmark..."
                  aria-label="Search area, street, landmark"
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] py-3.5 pr-4 pl-12 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                />
                {searchLoading && (
                  <div className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="-mt-2 overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-lg">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => pickSuggestion(s)}
                      className="flex w-full items-start gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 text-left last:border-0 hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="material-symbols-outlined mt-0.5 text-sm text-[var(--color-accent)]">
                        location_on
                      </span>
                      <div>
                        <p className="line-clamp-1 text-sm font-semibold text-[var(--color-on-surface)]">
                          {s.display_name.split(",")[0]}
                        </p>
                        <p className="line-clamp-1 text-xs text-[var(--color-outline-variant)]">
                          {s.display_name.split(",").slice(1).join(",").trim()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Map preview when location picked */}
              {pickedLocation && (
                <div className="space-y-3">
                  <div
                    className="overflow-hidden rounded-2xl border-2 border-[var(--color-primary)]/20"
                    style={{ height: 200 }}
                  >
                    <div ref={mapRef} className="h-full w-full" style={{ position: "relative" }} />
                  </div>
                  <p className="text-center text-xs text-[var(--color-outline)]">
                    Drag the pin to fine-tune the location
                  </p>

                  <input
                    type="text"
                    placeholder="Flat / House No. / Building *"
                    aria-label="Flat / House number"
                    value={flat}
                    onChange={(e) => setFlat(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Nearby Landmark (optional)"
                    aria-label="Nearby landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value.slice(0, 100))}
                    maxLength={100}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    aria-label="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  <textarea
                    placeholder="Delivery instructions (e.g. Ring bell, 2nd floor)"
                    aria-label="Delivery instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="h-20 w-full resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3.5 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:outline-none"
                  />

                  <div>
                    <p className="mb-2 text-sm font-bold text-[var(--color-on-surface)]">Save as</p>
                    <div className="flex gap-3">
                      {ADDRESS_TYPES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAddrType(t.id)}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${addrType === t.id ? "border-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] text-[var(--color-accent)]" : "border-[var(--color-border-subtle)] text-[var(--color-outline)]"}`}
                        >
                          <span className="material-symbols-outlined text-base">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={confirmManual}
                    disabled={!flat.trim() || phone.length !== 10}
                    className="bg-primary text-on-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 font-extrabold shadow-md transition-all hover:brightness-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Confirm Address
                  </button>
                </div>
              )}

              {!pickedLocation && suggestions.length === 0 && searchQuery.length < 3 && (
                <div className="py-8 text-center text-[var(--color-outline-variant)]">
                  <span className="material-symbols-outlined text-4xl">search</span>
                  <p className="mt-2 text-sm">Type at least 3 characters to search</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
