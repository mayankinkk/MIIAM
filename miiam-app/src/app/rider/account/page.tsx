"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useRiderOnlineStore } from "@/lib/store/riderOnlineStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PullToRefresh from "@/components/PullToRefresh";

interface Shift {
  id: string;
  name: string;
  hours: string;
  isSelected: boolean;
}

const weeklyShifts: Shift[] = [
  { id: "1", name: "Morning", hours: "6AM - 10AM", isSelected: false },
  { id: "2", name: "Lunch", hours: "10AM - 2PM", isSelected: false },
  { id: "3", name: "Evening", hours: "2PM - 6PM", isSelected: false },
  { id: "4", name: "Night", hours: "6PM - 10PM", isSelected: false },
];

export default function RiderAccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rider, setRider] = useState<{
    id: string;
    name?: string;
    phone?: string;
    is_online?: boolean;
    total_deliveries?: number;
    total_earnings?: number;
    rating?: number;
    vehicle_type?: string;
    created_at?: string;
    profile?: { full_name?: string; email?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState(weeklyShifts);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [activeShift, setActiveShift] = useState<string | null>("Lunch");
  const isOnline = useRiderOnlineStore((s) => s.isOnline);
  const setOnline = useRiderOnlineStore((s) => s.setOnline);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    loadRider();
  }, [supabase]);

  async function loadRider() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      
      const { data: riderData } = await supabase
        .from("riders")
        .select("*, profile:profiles(*)")
        .eq("user_id", user.id)
        .single();
      
      if (riderData) {
        setRider(riderData);
        setOnline(riderData.is_online || false);

        // Load saved shifts
        const { data: savedShifts } = await supabase
          .from("rider_shifts")
          .select("*")
          .eq("rider_id", riderData.id);
        if (savedShifts && savedShifts.length > 0) {
          setShifts(weeklyShifts.map(ws => {
            const saved = savedShifts.find((s: { shift_name: string; is_selected: boolean }) => s.shift_name === ws.name);
            return saved ? { ...ws, isSelected: saved.is_selected } : ws;
          }));
        }
      }
    } catch {
      setDataError("Couldn't load profile. Pull down to try again.");
    }
    setLoading(false);
  }

  const displayRider = rider ? {
    ...rider,
    totalDeliveries: rider.total_deliveries || 0,
    totalEarnings: rider.total_earnings || 0,
    rating: rider.rating || 5.0,
    phone: rider.phone,
    email: rider.profile?.email || "",
    name: rider.name || rider.profile?.full_name || "Rider",
    vehicle: rider.vehicle_type,
    isOnline: rider.is_online,
    joined: rider.created_at ? new Date(rider.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "N/A",
  } : null;

  async function toggleOnline() {
    const newStatus = !isOnline;
    if (rider) {
      await supabase.from("riders").update({ is_online: newStatus }).eq("id", rider.id);
      setOnline(newStatus);
    }
    useToastStore.getState().addToast(`You are now ${newStatus ? "Online" : "Offline"}`, "success");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/rider/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-[var(--color-surface-container-high)] rounded-full mx-auto mb-4" />
          <div className="h-6 bg-[var(--color-surface-container-high)] rounded w-32 mx-auto mb-2" />
          <div className="h-4 bg-[var(--color-surface-container-high)] rounded w-24 mx-auto" />
        </div>
      </div>
    );
  }

  if (!displayRider) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">person_off</span>
          <p className="text-[var(--color-outline)] mt-4">Rider profile not found</p>
          <Link href="/rider/login" className="text-brand-secondary font-bold mt-2 block">Go to Login</Link>
        </div>
      </div>
    );
  }

  const toggleShift = (shiftId: string) => {
    setShifts(shifts.map(s => ({
      ...s,
      isSelected: s.id === shiftId ? !s.isSelected : s.isSelected
    })));
  };

  const saveShifts = async () => {
    if (rider?.id) {
      // Delete existing shifts and re-insert
      await supabase.from("rider_shifts").delete().eq("rider_id", rider.id);
      for (const shift of shifts) {
        await supabase.from("rider_shifts").insert({
          rider_id: rider.id,
          shift_name: shift.name,
          hours: shift.hours,
          is_selected: shift.isSelected,
        });
      }
    }
    const selectedShifts = shifts.filter(s => s.isSelected).map(s => s.name).join(", ");
    useToastStore.getState().addToast(`Shifts saved: ${selectedShifts || "No shifts selected"}`, "success");
    setShowShiftModal(false);
  };

  return (
    <PullToRefresh onRefresh={async () => { setDataError(null); setLoading(true); await loadRider(); }}>
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      {dataError && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600">wifi_off</span>
          <p className="text-sm text-red-700 flex-1">{dataError}</p>
          <button onClick={() => { setDataError(null); loadRider(); }} className="text-red-700 font-bold text-sm">Retry</button>
        </div>
      )}
      <header className="bg-brand-secondary text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
          <button 
            onClick={handleSignOut}
            className="text-white/70 hover:text-white"
            aria-label="Sign out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6 pb-32">
        {/* Profile Card */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-lg -mt-12">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {displayRider.name?.[0] || "R"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">{displayRider.name}</h1>
              <p className="text-sm text-[var(--color-outline-variant)]">{displayRider.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-sm">{displayRider.rating}</span>
                <span className="text-[var(--color-outline-variant)] text-sm">• {displayRider.totalDeliveries} deliveries</span>
              </div>
            </div>
            <Link href="/rider/account" className="p-2 bg-[var(--color-surface-container)] rounded-full" aria-label="Edit profile">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">edit</span>
            </Link>
          </div>
        </div>

        {/* Online Toggle */}
        <button
          onClick={toggleOnline}
          className={`w-full p-5 rounded-2xl shadow-lg flex items-center justify-between ${
            isOnline ? "bg-green-500" : "bg-slate-300 dark:bg-gray-600"
          } text-white`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">
              {isOnline ? "location_on" : "location_off"}
            </span>
            <div className="text-left">
              <p className="font-bold text-lg">
                {isOnline ? "You're Online" : "You're Offline"}
              </p>
              <p className="text-sm text-white/70">
                {isOnline ? "Accepting orders" : "Turn on to receive orders"}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-3xl">
            {isOnline ? "toggle_on" : "toggle_off"}
          </span>
        </button>

        {/* Shift Schedule Button */}
        <button
          onClick={() => setShowShiftModal(true)}
          className="w-full p-4 bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">schedule</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-[var(--color-on-surface)]">My Schedule</p>
              <p className="text-xs text-[var(--color-outline)]">Set your availability</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
        </button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-brand-secondary">{displayRider?.totalDeliveries || 0}</p>
            <p className="text-[9px] text-[var(--color-outline-variant)]">Deliveries</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-green-600">₹{displayRider?.totalEarnings || 0}</p>
            <p className="text-[9px] text-[var(--color-outline-variant)]">Earned</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-brand-secondary">{(displayRider?.rating || 5).toFixed(1)}</p>
            <p className="text-[9px] text-[var(--color-outline-variant)]">Rating</p>
          </div>
        </div>

        {/* Rating Info */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-[var(--color-on-surface)]">Your Rating</p>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-lg text-[var(--color-on-surface)]">{(displayRider?.rating || 5).toFixed(1)}</span>
              <span className="text-[var(--color-outline-variant)] text-sm">/ 5.0</span>
            </div>
          </div>
          <div className="w-full bg-[var(--color-surface-container)] rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((displayRider?.rating || 5) / 5) * 100}%` }}></div>
          </div>
          <p className="text-xs text-[var(--color-outline-variant)] mt-2">Maintain 4.5+ to avoid suspension</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/rider/analytics" className="bg-[var(--color-surface-container-lowest)] p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">📊</span>
            <span className="text-[10px] font-bold">Analytics</span>
          </Link>
          <Link href="/rider/vehicle" className="bg-[var(--color-surface-container-lowest)] p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🛵</span>
            <span className="text-[10px] font-bold">Vehicle</span>
          </Link>
        </div>

        {/* Menu */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden shadow-lg">
          <Link href="/rider/orders" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">receipt_long</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">My Orders</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/wallet" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">account_balance_wallet</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Wallet & Earnings</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/analytics" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">insights</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Analytics</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/vehicle" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">two_wheeler</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">My Vehicle</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/training" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">school</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Training Center</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/incident" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-red-500">emergency</span>
            <span className="flex-1 font-bold text-red-600">Report Incident</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/notifications" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">notifications</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Notifications</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/support" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">help</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Help & Support</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/documents" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">description</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Documents</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/rate" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">rate_review</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Rate Customers</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <Link href="/rider/settings" className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-brand-secondary">settings</span>
            <span className="flex-1 font-bold text-[var(--color-on-surface)]">Settings</span>
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 p-4 w-full text-left text-red-500">
            <span className="material-symbols-outlined">logout</span>
            <span className="flex-1 font-bold">Sign Out</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          
        </div>

        {/* Language Settings */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">language</span>
              <span className="font-bold text-[var(--color-on-surface)]">Language</span>
            </div>
            <select className="bg-[var(--color-surface-subtle)] rounded-lg px-3 py-2 text-sm font-bold">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-outline-variant)]">
          MIIAM Rider v1.0 • {displayRider.joined}
        </p>
      </main>

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Set Your Schedule</h3>
              <button onClick={() => setShowShiftModal(false)} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-[var(--color-outline)] mb-4">Select your available time slots for this week</p>

            <div className="space-y-3 mb-6">
              {shifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => toggleShift(shift.id)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${
                    shift.isSelected ? "border-brand-secondary bg-blue-50 dark:bg-blue-900/20" : "border-[var(--color-border-subtle)]"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-[var(--color-on-surface)]">{shift.name}</p>
                    <p className="text-xs text-[var(--color-outline)]">{shift.hours}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    shift.isSelected ? "bg-brand-secondary" : "bg-[var(--color-surface-container-high)]"
                  }`}>
                    {shift.isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl mb-4">
              <p className="text-xs text-amber-700 dark:text-amber-300">💡 Tip: During selected shifts, you'll receive priority order notifications</p>
            </div>

            <button 
              onClick={saveShifts}
              className="w-full py-4 bg-brand-secondary text-white font-bold rounded-xl"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}


    </div>
    </PullToRefresh>
  );
}