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
  { id: "assault", icon: "⚠️", label: "Safety Concern", color: "bg-accent/10" },
  { id: "vehicle", icon: "🔧", label: "Vehicle Issue", color: "bg-accent/10" },
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rider } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (rider) {
        setRiderId(rider.id);
        const { data: incidents } = await supabase
          .from("rider_incidents")
          .select("*")
          .eq("rider_id", rider.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (incidents) {
          setRecentIncidents(
            incidents.map(
              (i: { id: string; type: string; created_at: string; status: string }) => ({
                id: i.id,
                type: i.type,
                date: new Date(i.created_at).toLocaleDateString("en-IN"),
                status: i.status,
              })
            )
          );
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
        const { data: incidents } = await supabase
          .from("rider_incidents")
          .select("*")
          .eq("rider_id", riderId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (incidents) {
          setRecentIncidents(
            incidents.map(
              (i: { id: string; type: string; created_at: string; status: string }) => ({
                id: i.id,
                type: i.type,
                date: new Date(i.created_at).toLocaleDateString("en-IN"),
                status: i.status,
              })
            )
          );
        }
      }
      import("@/lib/store/toastStore").then((m) =>
        m.useToastStore
          .getState()
          .addToast(
            "Incident reported successfully! Support team has been notified and will contact you shortly.",
            "success"
          )
      );
    } catch (e) {
      import("@/lib/store/toastStore").then((m) =>
        m.useToastStore.getState().addToast("Failed to submit report. Please try again.", "error")
      );
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
      <header className="rounded-b-[3rem] bg-gradient-to-br from-red-500 to-red-700 p-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">
            MIIAM
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-bold">🆘 Report Incident</h1>
        <p className="text-sm opacity-80">Quick help when you need it</p>
      </header>

      <main className="-mt-4 space-y-6 px-6 pb-32">
        {/* Emergency Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <p className="font-bold">Emergency?</p>
          </div>
          <p className="mb-3 text-sm opacity-90">
            Call immediately for life-threatening situations
          </p>
          <div className="flex gap-2">
            <a
              href="tel:102"
              className="flex-1 rounded-lg bg-[var(--color-surface-container-lowest)] py-2 text-center text-sm font-bold text-red-600"
            >
              Call 102
            </a>
            <a
              href="tel:100"
              className="flex-1 rounded-lg bg-[var(--color-surface-container-lowest)] py-2 text-center text-sm font-bold text-red-600"
            >
              Call 100
            </a>
          </div>
        </div>

        {/* One-Tap Emergency Button */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 text-center shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">One-Tap Emergency</h3>
          <button
            onClick={() => handleQuickReport("emergency")}
            className="mx-auto flex h-32 w-32 animate-pulse flex-col items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg"
          >
            <span className="mb-1 text-4xl">🆘</span>
            <span className="text-sm font-bold text-white">SOS</span>
          </button>
          <p className="mt-3 text-xs text-[var(--color-outline-variant)]">
            Press to alert support instantly
          </p>
        </div>

        {/* Quick Report Types */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">What happened?</h3>
          <div className="grid grid-cols-2 gap-3">
            {incidentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleQuickReport(type.id)}
                className={`rounded-xl p-4 ${type.color} flex flex-col items-center gap-2 transition-all hover:scale-105`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Quick Contacts</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact, i) => (
              <a
                key={i}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3 hover:bg-[var(--color-surface-container)]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-accent">phone</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{contact.name}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{contact.number}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-green-600">call</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Recent Reports</h3>
          <div className="space-y-3">
            {recentIncidents.length > 0 ? (
              recentIncidents.map((report, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-3"
                >
                  <div>
                    <p className="text-sm font-bold capitalize">
                      {report.type.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{report.date}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${report.status === "resolved" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {report.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="mt-4 text-center text-xs text-[var(--color-outline-variant)]">
                No recent issues
              </p>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <h3 className="mb-3 font-bold text-amber-800">💡 Safety Tips</h3>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <span className="text-3xl">
                  {incidentTypes.find((t) => t.id === selectedType)?.icon || "🚨"}
                </span>
              </div>
              <h3 className="text-xl font-bold">Report {selectedType?.replaceAll("_", " ")}</h3>
              <p className="mt-1 text-sm text-[var(--color-outline)]">We'll help you right away</p>
            </div>

            <div className="mb-4 space-y-3">
              <input
                placeholder="Brief description of the incident"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3 text-sm"
              />
              <input
                placeholder="Your current location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3 text-sm"
              />
            </div>

            <div className="mb-4 rounded-xl bg-[var(--color-surface-subtle)] p-3">
              <p className="text-xs text-[var(--color-outline)]">
                Support will contact you within 5 minutes
              </p>
            </div>

            <button
              onClick={submitReport}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-4 font-bold text-white disabled:opacity-50"
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
            <button
              onClick={() => setShowConfirm(false)}
              className="mt-2 w-full py-3 font-bold text-[var(--color-outline)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
