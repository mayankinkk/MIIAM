"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DetectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddressPickerPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<DetectedLocation | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressLabel, setAddressLabel] = useState<"home" | "office" | "other">("home");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let map: any;
    let L: any;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return;

      L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const defaultLat = 26.1445;
      const defaultLng = 91.7362;

      map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 40px;
          height: 40px;
          background: #ba001c;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="color: white; font-size: 20px;">📍</span></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([defaultLat, defaultLng], { icon: customIcon, draggable: true }).addTo(map);
      
      marker.on('dragend', async (e: any) => {
        const pos = e.target.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'MIIAM/1.0' } }
      );
      const data = await res.json();
      const address = buildAddressString(data.address, data.display_name);
      setCurrentLocation({ lat, lng, address });
    } catch (err) {
      setCurrentLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  const buildAddressString = (addr: any, displayName?: string): string => {
    const parts: string[] = [];
    if (addr?.house_number) parts.push(addr.house_number);
    if (addr?.road || addr?.street) parts.push(addr.road || addr.street);
    if (addr?.neighbourhood || addr?.suburb) parts.push(addr.neighbourhood || addr.suburb);
    if (addr?.city || addr?.town || addr?.village) parts.push(addr.city || addr.town || addr.village);
    if (addr?.state) parts.push(addr.state);
    if (addr?.postcode) parts.push(addr.postcode);
    if (parts.length >= 2) return parts.join(", ");
    if (displayName) return displayName.split(", ").slice(0, 3).join(", ");
    return "Selected location";
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'MIIAM/1.0' } }
      );
      const data = await res.json();
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
    
    setCurrentLocation({ lat, lng, address: result.display_name.split(", ").slice(0, 3).join(", ") });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleDetectLocation = () => {
    setDetecting(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        
        await reverseGeocode(latitude, longitude);
        setDetecting(false);
      },
      (error) => {
        setDetecting(false);
        switch (error.code) {
          case 1: setLocationError("Location permission denied"); break;
          case 2: setLocationError("Location unavailable"); break;
          case 3: setLocationError("Location timed out"); break;
          default: setLocationError("Could not get location");
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    if (!currentLocation?.address) {
      alert("Please select a location on the map");
      return;
    }

    let fullAddress = currentLocation.address;
    if (houseNumber.trim()) {
      fullAddress = houseNumber.trim() + ", " + fullAddress;
    }
    if (landmark.trim()) {
      fullAddress += "\nLandmark: " + landmark.trim();
    }
    fullAddress += "\n" + deliveryInstructions;

    const addressLabelText = addressLabel === "home" ? "Home" : addressLabel === "office" ? "Office" : "Other";

    localStorage.setItem('miiam_selected_address', JSON.stringify({
      address: fullAddress,
      label: addressLabelText,
      lat: currentLocation.lat,
      lng: currentLocation.lng
    }));

    router.push("/app/checkout");
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/app/checkout">
            <span className="material-symbols-outlined text-[#4d212a]">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#4d212a]">Select Delivery Address</h1>
            <p className="text-xs text-slate-500">Choose location on map or search</p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative pt-[60px]">
        <div ref={mapRef} className="absolute inset-0" />

        <button 
          onClick={handleDetectLocation}
          disabled={detecting}
          className="absolute bottom-36 right-4 z-40 bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition-all"
          title="Use current location"
        >
          {detecting ? (
            <span className="w-5 h-5 border-2 border-[#ba001c] border-t-transparent rounded-full animate-spin block" />
          ) : (
            <span className="material-symbols-outlined text-[#ba001c]">my_location</span>
          )}
        </button>

        {currentLocation && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-h-[45vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-sm">check</span>
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Location Selected</span>
              </div>
              <p className="font-medium text-[#4d212a]">{currentLocation.address}</p>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddressLabel("home")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                    addressLabel === "home" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">home</span>
                  Home
                </button>
                <button
                  onClick={() => setAddressLabel("office")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                    addressLabel === "office" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">work</span>
                  Office
                </button>
                <button
                  onClick={() => setAddressLabel("other")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                    addressLabel === "other" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
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
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
              />

              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby Landmark (optional)"
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
              />

              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Delivery instructions (e.g., gate code, floor)"
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                rows={2}
              />

              <button
                onClick={handleSave}
                className="w-full bg-[#ba001c] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#a40017] transition-colors"
              >
                Confirm & Deliver Here
              </button>
            </div>
          </div>
        )}

        {!currentLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-40">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search for area, street, landmark..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-[#ba001c] rounded-full animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 last:border-0"
                  >
                    <p className="text-sm text-[#4d212a] line-clamp-2">{result.display_name.split(", ").slice(0, 3).join(", ")}</p>
                  </button>
                ))}
              </div>
            )}

            {locationError && (
              <p className="text-red-500 text-xs mt-2">{locationError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}