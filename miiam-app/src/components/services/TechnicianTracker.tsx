"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TechnicianLocation {
  id: string;
  technician_name: string;
  technician_photo: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  eta_minutes: number;
  status: "assigned" | "en_route" | "arriving" | "at_location";
}

interface TechnicianTrackerProps {
  orderId: string;
}

export default function TechnicianTracker({ orderId }: TechnicianTrackerProps) {
  const supabase = createClient();
  const [technician, setTechnician] = useState<TechnicianLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      const { data } = await supabase
        .from("rider_locations")
        .select("*")
        .eq("order_id", orderId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setTechnician({
          id: data.rider_id,
          technician_name: data.rider_name || "Technician",
          technician_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
          phone: data.rider_phone || "",
          location: data.location,
          eta_minutes: data.eta_minutes || 15,
          status: "en_route",
        });
      } else {
        setTechnician({
          id: "demo",
          technician_name: "Rahul Sharma",
          technician_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
          phone: "+91 98765 43210",
          location: { lat: 26.1445, lng: 91.7362 },
          eta_minutes: 12,
          status: "en_route",
        });
      }
      setLoading(false);
    }

    fetchLocation();

    const channel = supabase
      .channel(`technician-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rider_locations",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setTechnician(prev => prev ? {
            ...prev,
            location: newData.location,
            eta_minutes: newData.eta_minutes || prev.eta_minutes,
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

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
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800">Track Technician</h4>
        <span className="text-sm font-bold text-green-600">{technician.eta_minutes} min away</span>
      </div>

      {/* Technician Info */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
        <img 
          src={technician.technician_photo} 
          alt={technician.technician_name} 
          className="w-14 h-14 rounded-full object-cover border-2 border-[#ba001c]"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800">{technician.technician_name}</p>
            <span className="material-symbols-outlined text-blue-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <p className="text-xs text-slate-500">Expert Technician</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-xs font-bold text-slate-700">4.9</span>
            <span className="text-xs text-slate-400">(342 reviews)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${technician.phone}`} className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200">
            <span className="material-symbols-outlined">call</span>
          </a>
          <a href={`sms:${technician.phone}`} className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200">
            <span className="material-symbols-outlined">chat</span>
          </a>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-1 bg-slate-300" />
          <div className="absolute left-1/4 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          <div className="absolute right-1/4 w-3 h-3 bg-[#ba001c] rounded-full" />
        </div>
        <div className="relative z-10 bg-white px-4 py-2 rounded-full shadow-lg">
          <span className="text-xs font-bold text-slate-600">Live tracking enabled</span>
        </div>
      </div>

      {/* Status Steps */}
      <div className="relative">
        <div className="flex justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStepIndex 
                  ? "bg-[#ba001c] text-white" 
                  : "bg-slate-100 text-slate-400"
              }`}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: index <= currentStepIndex ? "'FILL' 1" : "'FILL' 0" }}>
                  {index < currentStepIndex ? "check" : step.icon}
                </span>
              </div>
              <span className={`text-[10px] mt-1 font-bold ${index <= currentStepIndex ? "text-[#ba001c]" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-100 -z-0" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-slate-300">
          Get Directions
        </button>
        <button className="flex-1 py-2.5 bg-[#ba001c] rounded-xl font-bold text-sm text-white hover:bg-[#a40017]">
          Contact Support
        </button>
      </div>
    </div>
  );
}