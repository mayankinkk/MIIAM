"use client";

import { useState, useEffect, useRef } from "react";

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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number; display: string } | null>(null);
  const [flat, setFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [addrType, setAddrType] = useState("home");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // GPS detection + reverse geocode
  async function detectGPS() {
    setGpsStatus("detecting");
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Location not supported by your browser.");
      setGpsStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "MIIAM/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          setGpsAddress({
            label: "Current Location",
            street: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            city: addr.city || addr.town || addr.village || "Unknown",
            state: addr.state || "",
            postal_code: addr.postcode || "",
            lat,
            lng,
            type: "other",
          });
          setGpsStatus("detected");
        } catch {
          setGpsAddress({
            label: "Current Location",
            street: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            city: "",
            state: "",
            postal_code: "",
            lat,
            lng,
            type: "other",
          });
          setGpsStatus("detected");
        }
      },
      (err) => {
        setGpsError("Could not detect location. Please allow location access.");
        setGpsStatus("error");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  // Nominatim search autocomplete
  useEffect(() => {
    if (searchQuery.length < 3) { setSuggestions([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en", "User-Agent": "MIIAM/1.0" } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      setSearchLoading(false);
    }, 400);
  }, [searchQuery]);

  // Init map when a location is picked manually
  useEffect(() => {
    if (!pickedLocation || !mapRef.current || mapInstanceRef.current) return;
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!mounted || !mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: false }).setView(
        [pickedLocation.lat, pickedLocation.lng], 16
      );
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:40px;background:#ba001c;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(186,0,28,0.4)"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([pickedLocation.lat, pickedLocation.lng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      marker.on("dragend", async (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { "Accept-Language": "en", "User-Agent": "MIIAM/1.0" } }
          );
          const data = await res.json();
          setPickedLocation({ lat, lng, display: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } catch {
          setPickedLocation(prev => prev ? { ...prev, lat, lng } : null);
        }
      });
    })();
    return () => {
      mounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [pickedLocation?.lat, pickedLocation?.lng]);

  function pickSuggestion(s: any) {
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
    onSelect({
      label: addrType === "home" ? "Home" : addrType === "office" ? "Office" : "Other",
      street: [flat, parts[0]].filter(Boolean).join(", "),
      city: parts[1]?.trim() || "",
      state: parts[2]?.trim() || "",
      postal_code: parts[parts.length - 2]?.trim() || "",
      flat,
      landmark,
      instructions,
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      type: addrType,
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
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="addr-sheet fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Handle + Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Choose Delivery Location</h2>
            <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {savedAddresses.length > 0 && (
              <button
                onClick={() => setTab("saved")}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === "saved" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}
              >
                📋 Saved
              </button>
            )}
            <button
              onClick={() => { setTab("gps"); if (gpsStatus === "idle") detectGPS(); }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === "gps" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}
            >
              📍 Use GPS
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === "manual" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}
            >
              ✏️ Enter Manually
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SAVED TAB ── */}
          {tab === "saved" && (
            <div className="p-5 space-y-3">
              {savedAddresses.map((addr, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(addr)}
                  className="w-full text-left p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-[#ba001c] transition-all flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#ffe1e4] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#ba001c]">
                      {addr.type === "office" ? "business" : addr.type === "other" ? "place" : "home"}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{addr.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{addr.street}, {addr.city}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 ml-auto mt-1">chevron_right</span>
                </button>
              ))}
              <button
                onClick={() => setTab("gps")}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-[#ba001c]/30 text-[#ba001c] font-bold flex items-center justify-center gap-2 hover:bg-[#fff4f4]"
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
                  className="w-full py-5 bg-gradient-to-br from-[#ba001c] to-[#ff7670] text-white rounded-2xl font-extrabold flex flex-col items-center gap-3 shadow-lg shadow-[#ba001c]/25"
                >
                  <span className="material-symbols-outlined text-4xl">my_location</span>
                  <span>Detect My Location</span>
                  <span className="text-xs opacity-80 font-normal">Quick & accurate GPS detection</span>
                </button>
              )}

              {gpsStatus === "detecting" && (
                <div className="flex flex-col items-center py-12 gap-4">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-[#ba001c]/20 animate-ping" />
                    <div className="absolute inset-3 rounded-full bg-[#ba001c]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#ba001c] text-3xl">location_searching</span>
                    </div>
                  </div>
                  <p className="font-bold text-slate-700">Detecting your location...</p>
                  <p className="text-sm text-slate-400">Please allow location access</p>
                </div>
              )}

              {gpsStatus === "error" && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-red-400">location_off</span>
                  <p className="font-bold text-slate-700 mt-3">{gpsError}</p>
                  <button onClick={detectGPS} className="mt-4 px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold">
                    Try Again
                  </button>
                  <button onClick={() => setTab("manual")} className="mt-3 w-full py-3 text-[#ba001c] font-bold">
                    Enter Address Manually →
                  </button>
                </div>
              )}

              {gpsStatus === "detected" && gpsAddress && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-green-50 border-2 border-green-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">📡 GPS Detected</p>
                      <p className="font-bold text-slate-800 text-sm leading-relaxed">{gpsAddress.street}</p>
                      {gpsAddress.city && <p className="text-sm text-slate-500 mt-1">{gpsAddress.city}, {gpsAddress.state}</p>}
                    </div>
                  </div>

                  {/* Flat / Landmark */}
                  <input
                    type="text"
                    placeholder="Flat / House No. / Building *"
                    value={flat}
                    onChange={e => setFlat(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nearby Landmark (optional)"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm"
                  />

                  {/* Address type */}
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">Save as</p>
                    <div className="flex gap-3">
                      {ADDRESS_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setAddrType(t.id)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${addrType === t.id ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]" : "border-slate-200 text-slate-500"}`}
                        >
                          <span className="material-symbols-outlined text-base">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelect({ ...gpsAddress!, flat, landmark, instructions, type: addrType, label: addrType.charAt(0).toUpperCase() + addrType.slice(1) })}
                    disabled={!flat.trim()}
                    className="w-full py-4 bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white font-extrabold rounded-2xl disabled:opacity-50 shadow-lg shadow-[#ba001c]/20 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Confirm This Location
                  </button>

                  <button onClick={detectGPS} className="w-full py-3 text-slate-500 text-sm font-bold flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Re-detect Location
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <div className="p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search area, street, landmark..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm"
                />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg -mt-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => pickSuggestion(s)}
                      className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="material-symbols-outlined text-[#ba001c] text-sm mt-0.5">location_on</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{s.display_name.split(",")[0]}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{s.display_name.split(",").slice(1).join(",").trim()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Map preview when location picked */}
              {pickedLocation && (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border-2 border-[#ba001c]/20" style={{ height: 200 }}>
                    <div ref={mapRef} className="w-full h-full" />
                  </div>
                  <p className="text-xs text-slate-500 text-center">Drag the pin to fine-tune the location</p>

                  <input
                    type="text"
                    placeholder="Flat / House No. / Building *"
                    value={flat}
                    onChange={e => setFlat(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nearby Landmark (optional)"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm"
                  />
                  <textarea
                    placeholder="Delivery instructions (e.g. Ring bell, 2nd floor)"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/15 text-sm resize-none h-20"
                  />

                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">Save as</p>
                    <div className="flex gap-3">
                      {ADDRESS_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setAddrType(t.id)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${addrType === t.id ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]" : "border-slate-200 text-slate-500"}`}
                        >
                          <span className="material-symbols-outlined text-base">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={confirmManual}
                    disabled={!flat.trim()}
                    className="w-full py-4 bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white font-extrabold rounded-2xl disabled:opacity-50 shadow-lg shadow-[#ba001c]/20 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Confirm Address
                  </button>
                </div>
              )}

              {!pickedLocation && suggestions.length === 0 && searchQuery.length < 3 && (
                <div className="text-center py-8 text-slate-400">
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
