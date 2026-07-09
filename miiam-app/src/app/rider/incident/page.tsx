"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface IncidentType {
  id: string;
  icon: string;
  label: string;
  color: string;
}

interface IncidentReport {
  id: string;
  type: string;
  date: string;
  status: string;
}

const incidentTypes: IncidentType[] = [
  { id: "accident", icon: "🚨", label: "Accident", color: "bg-red-100" },
  { id: "theft", icon: "🔓", label: "Theft", color: "bg-orange-100" },
  { id: "assault", icon: "⚠️", label: "Safety Concern", color: "bg-purple-100" },
  { id: "vehicle", icon: "🔧", label: "Vehicle Issue", color: "bg-blue-100" },
  { id: "medical", icon: "🏥", label: "Medical Emergency", color: "bg-green-100" },
];

export default function RiderIncidentPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [recentIncidents, setRecentIncidents] = useState<IncidentReport[]>([]);
  const [emergencyContacts] = useState([
    { name: "Emergency Services", number: "102" },
    { name: "Police", number: "100" },
    { name: "Support Team", number: "99578 73472" },
  ]);

  useEffect(() => {
    async function loadRider() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (rider) {
        setRiderId(rider.id);
        const { data: incidents } = await supabase.from("rider_incidents").select("*").eq("rider_id", rider.id).order("created_at", { ascending: false }).limit(5);
        if (incidents) {
          setRecentIncidents(incidents.map((i: { id: string; type: string; created_at: string; status: string }) => ({
            id: i.id,
            type: i.type,
            date: new Date(i.created_at).toLocaleDateString("en-IN"),
            status: i.status,
          })));
        }
      }
    }
    loadRider();
  }, [supabase]);

  const handleQuickReport = (type: string) => {
    setSelectedType(type);
    setShowConfirm(true);
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    try {
      if (riderId) {
        await supabase.from("rider_incidents").insert({
          rider_id: riderId,
          type: selectedType || "other",
          description: description,
          location: location,
          status: "reported",
        });

        // Reload incidents
        const { data: incidents } = await supabase.from("rider_incidents").select("*").eq("rider_id", riderId).order("created_at", { ascending: false }).limit(5);
        if (incidents) {
          setRecentIncidents(incidents.map((i: { id: string; type: string; created_at: string; status: string }) => ({
            id: i.id,
            type: i.type,
            date: new Date(i.created_at).toLocaleDateString("en-IN"),
            status: i.status,
          })));
        }
      }
      import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Incident reported successfully! Support team has been notified and will contact you shortly.", "success"));
    } catch (e) {
      import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Failed to submit report. Please try again.", "error"));
    }
    setIsSubmitting(false);
    setShowConfirm(false);
    setSelectedType(null);
    setDescription("");
    setLocation("");
    router.push("/rider/dashboard");
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-gradient-to-br from-red-500 to-red-700 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">🆘 Report Incident</h1>
        <p className="text-sm opacity-80">Quick help when you need it</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Emergency Banner */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🚨</span>
            <p className="font-bold">Emergency?</p>
          </div>
          <p className="text-sm opacity-90 mb-3">Call immediately for life-threatening situations</p>
          <div className="flex gap-2">
            <a href="tel:102" className="flex-1 bg-[var(--color-surface-container-lowest)] text-red-600 py-2 rounded-lg font-bold text-center text-sm">
              Call 102
            </a>
            <a href="tel:100" className="flex-1 bg-[var(--color-surface-container-lowest)] text-red-600 py-2 rounded-lg font-bold text-center text-sm">
              Call 100
            </a>
          </div>
        </div>

        {/* One-Tap Emergency Button */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg text-center">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">One-Tap Emergency</h3>
          <button
            onClick={() => handleQuickReport("emergency")}
            className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex flex-col items-center justify-center mx-auto shadow-lg animate-pulse"
          >
            <span className="text-4xl mb-1">🆘</span>
            <span className="text-white font-bold text-sm">SOS</span>
          </button>
          <p className="text-xs text-[var(--color-outline-variant)] mt-3">Press to alert support instantly</p>
        </div>

        {/* Quick Report Types */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">What happened?</h3>
          <div className="grid grid-cols-2 gap-3">
            {incidentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleQuickReport(type.id)}
                className={`p-4 rounded-xl ${type.color} flex flex-col items-center gap-2 transition-all hover:scale-105`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="font-bold text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Quick Contacts</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact, i) => (
              <a 
                key={i}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl hover:bg-[var(--color-surface-container)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">phone</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{contact.name}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{contact.number}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-green-600">call</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {recentIncidents.length > 0 ? recentIncidents.map((report, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
                <div>
                  <p className="font-bold text-sm capitalize">{report.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">{report.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${report.status === "resolved" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                  {report.status}
                </span>
              </div>
            )) : (
              <p className="text-center text-xs text-[var(--color-outline-variant)] mt-4">No recent issues</p>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-3">💡 Safety Tips</h3>
          <div className="space-y-2 text-sm text-amber-700">
            <p>• Always wear helmet while riding</p>
            <p>• Keep emergency numbers saved</p>
            <p>• Report suspicious locations</p>
            <p>• Follow traffic rules strictly</p>
          </div>
        </div>
      </main>

      {/* Incident Report Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">
                  {incidentTypes.find(t => t.id === selectedType)?.icon || "🚨"}
                </span>
              </div>
              <h3 className="font-bold text-xl">Report {selectedType?.replaceAll("_", " ")}</h3>
              <p className="text-sm text-[var(--color-outline)] mt-1">We'll help you right away</p>
            </div>

            <div className="space-y-3 mb-4">
              <input 
                placeholder="Brief description of the incident"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border-2 border-[var(--color-border-subtle)] rounded-xl text-sm"
              />
              <input 
                placeholder="Your current location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 border-2 border-[var(--color-border-subtle)] rounded-xl text-sm"
              />
            </div>

            <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
              <p className="text-xs text-[var(--color-outline)]">Support will contact you within 5 minutes</p>
            </div>

            <button 
              onClick={submitReport}
              disabled={isSubmitting}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Submit Report
                </>
              )}
            </button>
            <button onClick={() => setShowConfirm(false)} className="w-full py-3 text-[var(--color-outline)] font-bold mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}