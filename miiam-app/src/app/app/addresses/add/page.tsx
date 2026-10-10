"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToastStore } from "@/lib/store/toastStore";
import { reverseGeocode as sharedReverseGeocode, searchLocation } from "@/lib/geocoding";
import {
  multiShotDetectWithFallback,
  classifyAccuracy,
  SINGLESHOT_POSITION_OPTIONS,
} from "@/lib/location-detection";
import type * as L from "leaflet";

interface DetectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface SearchResult {
  place_id?: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddressPickerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<DetectedLocation | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressLabel, setAddressLabel] = useState<"home" | "office" | "other">("home");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToastStore();
  const [autoDetectOnLoad, setAutoDetectOnLoad] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "detecting" | "improving" | "good" | "error"
  >("detecting");

  useEffect(() => {
    let map: L.Map;
    let L: typeof import("leaflet");
    let isMounted = true;

    const initMap = async (centerLat?: number, centerLng?: number) => {
      if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return;

      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      const defaultLat = centerLat ?? 26.1445;
      const defaultLng = centerLng ?? 91.7362;

      map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([defaultLat, defaultLng], 18);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const crosshairIcon = L.divIcon({
        className: "crosshair-marker",
        html: `
          <div style="position: relative; width: 60px; height: 60px;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(248,203,70,0.9); border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.4);"></div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; border: 2px solid rgba(248,203,70,0.5); border-radius: 50%;"></div>
            <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 2px; height: 12px; background: rgba(248,203,70,0.7);"></div>
            <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 2px; height: 12px; background: rgba(248,203,70,0.7);"></div>
            <div style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 2px; background: rgba(248,203,70,0.7);"></div>
            <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 12px; height: 2px; background: rgba(248,203,70,0.7);"></div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });

      const accuracyCircle = L.circle([defaultLat, defaultLng], {
        radius: 20,
        color: "var(--color-secondary)",
        fillColor: "var(--color-secondary)",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        icon: crosshairIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      const updateLocation = async (lat: number, lng: number) => {
        if (!isMounted) return;
        accuracyCircle.setLatLng([lat, lng]);
        await reverseGeocode(lat, lng);
      };

      marker.on("dragend", async (e: { target: L.Marker }) => {
        const pos = e.target.getLatLng();
        map.setView([pos.lat, pos.lng], 18);
        await updateLocation(pos.lat, pos.lng);
      });

      map.on("click", async (e: { latlng: L.LatLng }) => {
        if (!isMounted) return;
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 18);
        await updateLocation(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      if (centerLat && centerLng) {
        setTimeout(() => updateLocation(centerLat, centerLng), 300);
      }

      setMapLoaded(true);
    };

    const getInitialLocation = async () => {
      if (!navigator.geolocation) {
        initMap();
        return;
      }

      setDetecting(true);
      setLocationStatus("detecting");

      try {
        const result = await multiShotDetectWithFallback(3);
        const { lat, lng, accuracy } = result;

        setLocationAccuracy(accuracy);
        const level = classifyAccuracy(accuracy);
        setLocationStatus(
          level === "excellent" || level === "good"
            ? "good"
            : level === "acceptable"
              ? "improving"
              : "detecting"
        );

        await initMap(lat, lng);
        setDetecting(false);
      } catch {
        setLocationError("Could not get GPS. Search or tap map to select.");
        setLocationStatus("error");
        initMap();
        setDetecting(false);
      }
    };

    getInitialLocation();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng, address: "Fetching address..." });

    try {
      const geo = await sharedReverseGeocode(lat, lng);
      setCurrentLocation({ lat, lng, address: geo.displayAddress });
    } catch {
      setCurrentLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await searchLocation(query, 5);
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const handleSelectSearchResult = async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    setCurrentLocation({
      lat,
      lng,
      address: result.display_name.split(", ").slice(0, 3).join(", "),
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleDetectLocation = async (showLoading = true) => {
    if (showLoading) {
      setDetecting(true);
      setLocationError("");
      setLocationStatus("detecting");
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocationStatus("error");
      if (showLoading) setDetecting(false);
      return;
    }

    try {
      const result = await multiShotDetectWithFallback(3);
      const { lat, lng, accuracy } = result;
      setLocationAccuracy(accuracy);
      const level = classifyAccuracy(accuracy);
      setLocationStatus(
        level === "excellent" || level === "good"
          ? "good"
          : level === "acceptable"
            ? "improving"
            : "detecting"
      );

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 19);
        markerRef.current.setLatLng([lat, lng]);
      }

      await reverseGeocode(lat, lng);
      setDetecting(false);
    } catch {
      setDetecting(false);
      setLocationStatus("error");
      setLocationError("Could not get location");
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!currentLocation?.address) {
      addToast("Please select a location on the map", "error");
      return;
    }

    if (currentLocation.address === "Fetching address...") {
      addToast("Please wait for address to load", "error");
      return;
    }

    setSaving(true);

    let fullAddress = currentLocation.address;
    if (houseNumber.trim()) {
      fullAddress = houseNumber.trim() + ", " + fullAddress;
    }
    if (landmark.trim()) {
      fullAddress += "\nLandmark: " + landmark.trim();
    }
    fullAddress += "\n" + deliveryInstructions;

    const addressLabelText =
      addressLabel === "home" ? "Home" : addressLabel === "office" ? "Office" : "Other";

    const newAddress = {
      id: "addr" + Date.now(),
      label: addressLabelText,
      name: houseNumber.trim() || fullAddress.split(",")[0],
      street: fullAddress,
      city: "",
      state: "",
      postal_code: "",
      phone: "",
      instructions: deliveryInstructions,
      is_default: true,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
    };

    const savedAddresses = JSON.parse(localStorage.getItem("miiam_addresses") || "[]");
    const updatedAddresses = [...savedAddresses, newAddress];
    localStorage.setItem("miiam_addresses", JSON.stringify(updatedAddresses));

    localStorage.setItem(
      "miiam_selected_address",
      JSON.stringify({
        address: fullAddress,
        label: addressLabelText,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      })
    );

    setSaving(false);
    addToast("Address saved successfully!", "success");
    router.push("/app/checkout");
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container-lowest)]">
      <header className="fixed top-0 right-0 left-0 z-50 bg-[var(--color-surface-container-lowest)] shadow-md dark:bg-[var(--color-surface-container-lowest)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/app/checkout" aria-label="Go back">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-on-surface text-lg font-bold">Select Delivery Address</h1>
            <p className="text-xs text-[var(--color-outline)]">Choose location on map or search</p>
          </div>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Addresses", href: "/app/addresses" },
          { label: "Add Address" },
        ]}
      />

      <div className="relative flex-1 pt-[60px]">
        <div ref={mapRef} className="absolute inset-0" />

        <button
          onClick={() => handleDetectLocation(true)}
          disabled={detecting}
          className="absolute right-4 bottom-36 z-40 rounded-full bg-[var(--color-surface-container-lowest)] p-3 shadow-lg transition-all hover:bg-[var(--color-surface-subtle)] dark:bg-[var(--color-surface-container-lowest)]"
          title="Use current location"
        >
          {detecting ? (
            <span className="border-primary block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          ) : (
            <span className="material-symbols-outlined text-accent">my_location</span>
          )}
        </button>

        {/* Accuracy Status */}
        {detecting && (
          <div className="absolute top-24 right-4 left-4 z-40 rounded-xl bg-[var(--color-surface-container-lowest)]/95 p-3 shadow-lg backdrop-blur dark:bg-[var(--color-surface-container-lowest)]/95">
            <div className="flex items-center gap-2">
              {locationStatus === "improving" ? (
                <span className="border-accent/40 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              ) : (
                <span className="bg-accent h-4 w-4 animate-pulse rounded-full" />
              )}
              <span className="text-sm font-medium text-[var(--color-on-surface)]">
                {locationStatus === "improving" ? "Improving accuracy..." : "Detecting location..."}
              </span>
            </div>
            {locationAccuracy && (
              <p className="mt-1 text-xs text-[var(--color-outline)]">
                Accuracy: {locationAccuracy.toFixed(0)}m{" "}
                {locationAccuracy <= 10 ? "✓" : "(need <10m)"}
              </p>
            )}
          </div>
        )}

        {/* Bottom form panel - always show */}
        <div
          className="absolute right-0 bottom-0 left-0 max-h-[50vh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface-container-lowest)] shadow-xl dark:bg-[var(--color-surface-container-lowest)]"
          style={{ zIndex: 9999 }}
        >
          <div className="border-b border-[var(--color-border-subtle)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <span className="material-symbols-outlined text-sm text-green-600 dark:text-green-400">
                  location_on
                </span>
              </span>
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {currentLocation
                  ? locationAccuracy
                    ? `GPS Accuracy: ${locationAccuracy.toFixed(0)}m`
                    : "Location Selected"
                  : "Tap map or search to select"}
              </span>
            </div>
            {currentLocation ? (
              <>
                <p className="text-on-surface text-sm font-medium">{currentLocation.address}</p>
                <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--color-outline)]">
                Move the crosshair on the map or search below to select your delivery location
              </p>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search for area, street, landmark..."
                className="focus:border-primary w-full rounded-lg border border-[var(--color-border-subtle)] py-3 pr-4 pl-10 text-sm focus:outline-none"
              />
              {searching && (
                <span className="border-t-primary absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--color-outline-variant)]" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border-subtle)]">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full border-b border-[var(--color-border-subtle)] p-3 text-left last:border-0 hover:bg-[var(--color-surface-subtle)]"
                  >
                    <p className="text-on-surface line-clamp-2 text-sm">
                      {result.display_name.split(", ").slice(0, 3).join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs font-medium tracking-wide text-[var(--color-outline)] uppercase">
              Address Label
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAddressLabel("home")}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  addressLabel === "home"
                    ? "bg-primary text-on-primary"
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Home
              </button>
              <button
                onClick={() => setAddressLabel("office")}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  addressLabel === "office"
                    ? "bg-primary text-on-primary"
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">work</span>
                Office
              </button>
              <button
                onClick={() => setAddressLabel("other")}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  addressLabel === "other"
                    ? "bg-primary text-on-primary"
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">location_on</span>
                Other
              </button>
            </div>

            <input
              type="text"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="House/Flat No., Building Name"
              className="focus:border-primary w-full rounded-lg border border-[var(--color-border-subtle)] p-3 text-sm focus:outline-none"
            />

            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Nearby Landmark (optional)"
              className="focus:border-primary w-full rounded-lg border border-[var(--color-border-subtle)] p-3 text-sm focus:outline-none"
            />

            <textarea
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Delivery instructions (e.g., gate code, floor)"
              className="focus:border-primary w-full rounded-lg border border-[var(--color-border-subtle)] p-3 text-sm focus:outline-none"
              rows={2}
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleDetectLocation(true)}
                disabled={detecting}
                className="border-secondary text-secondary hover:bg-accent/10 flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-bold transition-colors"
              >
                {detecting ? (
                  <span className="border-secondary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-sm">my_location</span>
                )}
                {t.home.detectMyLocation}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !currentLocation}
                className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary flex flex-[2] items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
                {saving ? "Saving..." : "Confirm Address"}
              </button>
            </div>
          </div>
        </div>

        {locationError && !mapLoaded && (
          <div className="absolute right-4 bottom-4 left-4 z-40 rounded-xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg dark:bg-[var(--color-surface-container-lowest)]">
            <p className="text-xs text-red-500">{locationError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
