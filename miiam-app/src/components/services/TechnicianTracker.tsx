"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface TechnicianLocation {
  id: string;
  technician_name: string;
  technician_photo: string;
  phone: string;
  location: { lat: number; lng: number };
  customer_location?: { lat: number; lng: number };
  eta_minutes: number;
  status: "assigned" | "en_route" | "arriving" | "at_location";
}

interface TechnicianTrackerProps {
  orderId: string;
  customerLat?: number;
  customerLng?: number;
}

export default function TechnicianTracker({ orderId, customerLat = 26.1465, customerLng = 91.7382 }: TechnicianTrackerProps) {
  const supabase = createClient();
  const [technician, setTechnician] = useState<TechnicianLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    async function loadLeaflet() {
      if (typeof window !== "undefined" && !window.L) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    }
    loadLeaflet();
  }, []);

  useEffect(() => {
    async function fetchLocation() {
      const { data } = await supabase
        .from("rider_locations")
        .select("*")
        .eq("order_id", orderId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      const techLocation = {
        lat: 26.1445 + (Math.random() * 0.002 - 0.001),
        lng: 91.7362 + (Math.random() * 0.002 - 0.001),
      };

      if (data?.location) {
        setTechnician({
          id: data.rider_id || "demo",
          technician_name: data.rider_name || "Rahul Sharma",
          technician_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
          phone: data.rider_phone || "+91 98765 43210",
          location: data.location,
          customer_location: { lat: customerLat, lng: customerLng },
          eta_minutes: data.eta_minutes || 12,
          status: "en_route",
        });
      } else {
        setTechnician({
          id: "demo",
          technician_name: "Rahul Sharma",
          technician_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
          phone: "+91 98765 43210",
          location: techLocation,
          customer_location: { lat: customerLat, lng: customerLng },
          eta_minutes: 12,
          status: "en_route",
        });
      }
      setLoading(false);
    }

    fetchLocation();

    const channel = supabase
      .channel(`technician-tracking-${orderId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rider_locations",
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        const newData = payload.new as any;
        if (newData.location) {
          setTechnician(prev => {
            if (!prev) return null;
            const newEta = Math.max(1, prev.eta_minutes - (Math.random() > 0.5 ? 1 : 0));
            return {
              ...prev,
              location: newData.location,
              eta_minutes: newData.eta_minutes || newEta,
            };
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, customerLat, customerLng]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !technician || leafletMapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([technician.location.lat, technician.location.lng], 15);
    leafletMapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© MIIAM",
    }).addTo(map);

    const techIcon = L.divIcon({
      html: `<div class="relative">
        <div class="w-12 h-12 bg-[#ba001c] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span class="material-symbols-outlined text-white text-lg" style="font-variation-settings:'FILL'1">person</span>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#ba001c] rotate-45"></div>
      </div>`,
      className: "technician-marker",
      iconSize: [48, 60],
      iconAnchor: [24, 60],
    });

    const customerIcon = L.divIcon({
      html: `<div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-3 border-white">
        <span class="material-symbols-outlined text-white text-sm" style="font-variation-settings:'FILL'1">home</span>
      </div>`,
      className: "customer-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    markerRef.current = L.marker([technician.location.lat, technician.location.lng], { icon: techIcon }).addTo(map);
    
    if (technician.customer_location) {
      L.marker([technician.customer_location.lat, technician.customer_location.lng], { icon: customerIcon }).addTo(map);
      
      const points = [
        [technician.customer_location.lat, technician.customer_location.lng],
        [technician.location.lat, technician.location.lng],
      ];
      L.polyline(points, { color: "#ba001c", weight: 3, opacity: 0.7, dashArray: "10,10" }).addTo(map);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapLoaded, technician]);

  useEffect(() => {
    if (!leafletMapRef.current || !technician || !markerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const newLat = technician.location.lat + (Math.random() * 0.0005 - 0.00025);
    const newLng = technician.location.lng + (Math.random() * 0.0005 - 0.00025);
    
    markerRef.current.setLatLng([newLat, newLng]);
    leafletMapRef.current.panTo([newLat, newLng]);

    setTechnician(prev => prev ? { ...prev, location: { lat: newLat, lng: newLng } } : null);
  }, [technician?.location.lat]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="p-4 bg-white rounded-xl border border-slate-100">
        <p className="text-sm text-slate-500 text-center">Technician not assigned yet</p>
      </div>
    );
  }

  const statusSteps = [
    { key: "assigned", label: "Assigned", icon: "person" },
    { key: "en_route", label: "En Route", icon: "directions_car" },
    { key: "arriving", label: "Arriving", icon: "location_on" },
    { key: "at_location", label: "At Location", icon: "check_circle" },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === technician.status);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h4 className="font-bold text-slate-800">Live Tracking</h4>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-green-600 text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
          <span className="text-sm font-bold text-green-600">{technician.eta_minutes} min</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-slate-100">
        <div ref={mapRef} className="h-48 w-full" />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <div className="w-2 h-2 bg-[#ba001c] rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-700">Live</span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <span className="material-symbols-outlined text-blue-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-xs font-bold text-slate-700">Your Location</span>
        </div>
      </div>

      {/* ETA Progress Bar */}
      <div className="relative bg-slate-100 rounded-full h-2 overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] transition-all duration-1000 rounded-full"
          style={{ width: `${Math.max(10, 100 - (technician.eta_minutes * 7))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Technician left</span>
        <span>Almost there!</span>
      </div>

      {/* Technician Info */}
      <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-slate-50 to-red-50 rounded-xl border border-slate-100">
        <div className="relative">
          <img 
            src={technician.technician_photo} 
            alt={technician.technician_name} 
            className="w-14 h-14 rounded-full object-cover border-2 border-[#ba001c]"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800">{technician.technician_name}</p>
            <span className="material-symbols-outlined text-blue-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <p className="text-xs text-slate-500">Expert Technician • 8+ yrs exp</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-xs font-bold text-slate-700">4.9</span>
            <span className="text-xs text-slate-400">(342 reviews)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a 
            href={`tel:${technician.phone}`} 
            className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">call</span>
          </a>
          <a 
            href={`sms:${technician.phone}`} 
            className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">chat</span>
          </a>
        </div>
      </div>

      {/* Status Steps */}
      <div className="relative pt-2">
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-100" />
        <div className="absolute top-5 left-4 h-0.5 bg-[#ba001c] transition-all duration-500" 
             style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }} />
        <div className="flex justify-between relative z-10">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStepIndex 
                  ? "bg-[#ba001c] text-white shadow-lg shadow-[#ba001c]/30" 
                  : index === currentStepIndex
                  ? "bg-[#ba001c] text-white shadow-lg shadow-[#ba001c]/30 ring-4 ring-[#ba001c]/20"
                  : "bg-slate-100 text-slate-400"
              }`}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: index <= currentStepIndex ? "'FILL' 1" : "'FILL' 0" }}>
                  {index < currentStepIndex ? "check" : step.icon}
                </span>
              </div>
              <span className={`text-[10px] mt-2 font-bold ${index <= currentStepIndex ? "text-[#ba001c]" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${technician.location.lat},${technician.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">directions</span>
          Directions
        </a>
        <button className="flex-1 py-3 bg-[#ba001c] rounded-xl font-bold text-sm text-white hover:bg-[#a40017] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-lg">support_agent</span>
          Support
        </button>
      </div>
    </div>
  );
}