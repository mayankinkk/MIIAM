"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const supabase = createClient();
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState(weeklyShifts);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [activeShift, setActiveShift] = useState<string | null>("Lunch");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadRider();
  }, [supabase]);

  async function loadRider() {
    const { data } = await supabase
      .from("riders")
      .select("*, profile:profiles(*)")
      .single();
    if (data) setRider(data);
    setLoading(false);
  }

  const mockRider = {
    name: "Delhi Metro Rider",
    phone: "+91 12345 67890",
    email: "fordelhimetro1@gmail.com",
    vehicle: "Honda Activa",
    rating: 4.9,
    totalDeliveries: 342,
    joined: "May 2026",
    isOnline: true,
    timeOnJob: "4h 32m",
    distanceCovered: "28.5 km",
  };

  const displayRider = rider || mockRider;

  async function toggleOnline() {
    const newStatus = !displayRider.isOnline;
    if (rider) {
      await supabase.from("riders").update({ is_online: newStatus }).eq("id", rider.id);
    }
    alert(`You are now ${newStatus ? "Online" : "Offline"}`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/rider/login");
  }

  const toggleShift = (shiftId: string) => {
    setShifts(shifts.map(s => ({
      ...s,
      isSelected: s.id === shiftId ? !s.isSelected : s.isSelected
    })));
  };

  const saveShifts = () => {
    const selectedShifts = shifts.filter(s => s.isSelected).map(s => s.name).join(", ");
    alert(`Shifts saved: ${selectedShifts || "No shifts selected"}`);
    setShowShiftModal(false);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
          <button 
            onClick={handleSignOut}
            className="text-white/70 hover:text-white"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6 pb-32">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg -mt-12">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#0b50d5] rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {displayRider.name?.[0] || "R"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#4d212a]">{displayRider.name}</h1>
              <p className="text-sm text-slate-400">{displayRider.phone}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-sm">{displayRider.rating}</span>
                <span className="text-slate-400 text-sm">• {displayRider.totalDeliveries} deliveries</span>
              </div>
            </div>
            <button className="p-2 bg-slate-100 rounded-full">
              <span className="material-symbols-outlined text-slate-600">edit</span>
            </button>
          </div>
        </div>

        {/* Online Toggle */}
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            alert(isOnline ? "You're now OFFLINE" : "You're now ONLINE");
          }}
          className={`w-full p-5 rounded-2xl shadow-lg flex items-center justify-between ${
            isOnline ? "bg-green-500" : "bg-slate-300"
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
          className="w-full p-4 bg-white rounded-2xl shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">schedule</span>
            </div>
            <div className="text-left">
              <p className="font-bold text-[#4d212a]">My Schedule</p>
              <p className="text-xs text-slate-500">Set your availability</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-[#0b50d5]">{displayRider.totalDeliveries}</p>
            <p className="text-[9px] text-slate-400">Deliveries</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-[#0b50d5]">{displayRider.timeOnJob}</p>
            <p className="text-[9px] text-slate-400">Time Online</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
            <p className="text-lg font-black text-[#0b50d5]">{displayRider.distanceCovered}</p>
            <p className="text-[9px] text-slate-400">Distance</p>
          </div>
        </div>

        {/* Rating Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-[#4d212a]">Your Rating</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((star) => (
                <span 
                  key={star}
                  className={`text-lg ${star <= Math.floor(displayRider.rating) ? "text-yellow-400" : "text-slate-300"}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(displayRider.rating / 5) * 100}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Maintain 4.5+ to avoid suspension</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-2">
          <Link href="/rider/analytics" className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">📊</span>
            <span className="text-[10px] font-bold">Analytics</span>
          </Link>
          <Link href="/rider/achievements" className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🏆</span>
            <span className="text-[10px] font-bold">Badges</span>
          </Link>
          <Link href="/rider/vehicle" className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🛵</span>
            <span className="text-[10px] font-bold">Vehicle</span>
          </Link>
          <Link href="/rider/referral" className="bg-white p-3 rounded-xl shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🎁</span>
            <span className="text-[10px] font-bold">Refer</span>
          </Link>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <Link href="/rider/orders" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">receipt_long</span>
            <span className="flex-1 font-bold text-[#4d212a]">My Orders</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/wallet" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">account_balance_wallet</span>
            <span className="flex-1 font-bold text-[#4d212a]">Wallet & Earnings</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/analytics" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">insights</span>
            <span className="flex-1 font-bold text-[#4d212a]">Analytics</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/achievements" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-amber-500">emoji_events</span>
            <span className="flex-1 font-bold text-[#4d212a]">Achievements</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/vehicle" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">two_wheeler</span>
            <span className="flex-1 font-bold text-[#4d212a]">My Vehicle</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/training" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">school</span>
            <span className="flex-1 font-bold text-[#4d212a]">Training Center</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/referral" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-purple-500">group_add</span>
            <span className="flex-1 font-bold text-[#4d212a]">Refer & Earn</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/incident" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-red-500">emergency</span>
            <span className="flex-1 font-bold text-red-600">Report Incident</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/notifications" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">notifications</span>
            <span className="flex-1 font-bold text-[#4d212a]">Notifications</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/support" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">help</span>
            <span className="flex-1 font-bold text-[#4d212a]">Help & Support</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/documents" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">description</span>
            <span className="flex-1 font-bold text-[#4d212a]">Documents</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/rate" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">rate_review</span>
            <span className="flex-1 font-bold text-[#4d212a]">Rate Customers</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="/rider/settings" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">settings</span>
            <span className="flex-1 font-bold text-[#4d212a]">Settings</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 p-4 w-full text-left text-red-500">
            <span className="material-symbols-outlined">logout</span>
            <span className="flex-1 font-bold">Sign Out</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-600">language</span>
              <span className="font-bold text-[#4d212a]">Language</span>
            </div>
            <select className="bg-slate-50 rounded-lg px-3 py-2 text-sm font-bold">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          MIIAM Rider v1.0 • {displayRider.joined}
        </p>
      </main>

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Set Your Schedule</h3>
              <button onClick={() => setShowShiftModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">Select your available time slots for this week</p>

            <div className="space-y-3 mb-6">
              {shifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => toggleShift(shift.id)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${
                    shift.isSelected ? "border-[#0b50d5] bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-[#4d212a]">{shift.name}</p>
                    <p className="text-xs text-slate-500">{shift.hours}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    shift.isSelected ? "bg-[#0b50d5]" : "bg-slate-200"
                  }`}>
                    {shift.isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 p-3 rounded-xl mb-4">
              <p className="text-xs text-amber-700">💡 Tip: During selected shifts, you'll receive priority order notifications</p>
            </div>

            <button 
              onClick={saveShifts}
              className="w-full py-4 bg-[#0b50d5] text-white font-bold rounded-xl"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}