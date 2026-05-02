"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RiderAccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    name: "David S.",
    phone: "+91 98765 43210",
    email: "david@email.com",
    vehicle: "Honda Activa",
    rating: 4.9,
    totalDeliveries: 342,
    joined: "Jan 2024",
    isOnline: true,
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

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider" className="text-3xl font-black tracking-tighter">MIIAM</Link>
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
                <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                <span className="font-bold text-sm">{displayRider.rating}</span>
                <span className="text-slate-400 text-sm">• {displayRider.totalDeliveries} deliveries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Online Toggle */}
        <button
          onClick={toggleOnline}
          className={`w-full p-6 rounded-2xl shadow-lg flex items-center justify-between ${
            displayRider.isOnline ? "bg-green-500" : "bg-slate-300"
          } text-white`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">
              {displayRider.isOnline ? "location_on" : "location_off"}
            </span>
            <div className="text-left">
              <p className="font-bold text-lg">
                {displayRider.isOnline ? "You're Online" : "You're Offline"}
              </p>
              <p className="text-sm text-white/70">
                {displayRider.isOnline ? "Accepting orders" : "Turn on to receive orders"}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-3xl">
            {displayRider.isOnline ? "toggle_on" : "toggle_off"}
          </span>
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <p className="text-3xl font-black text-[#0b50d5]">{displayRider.totalDeliveries}</p>
            <p className="text-xs text-slate-400">Total Deliveries</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <p className="text-3xl font-black text-[#0b50d5]">{displayRider.rating}</p>
            <p className="text-xs text-slate-400">Rating</p>
          </div>
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
          <Link href="#" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">notifications</span>
            <span className="flex-1 font-bold text-[#4d212a]">Notifications</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">help</span>
            <span className="flex-1 font-bold text-[#4d212a]">Help & Support</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 p-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-[#0b50d5]">description</span>
            <span className="flex-1 font-bold text-[#4d212a]">Documents</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 p-4 w-full text-left text-red-500">
            <span className="material-symbols-outlined">logout</span>
            <span className="flex-1 font-bold">Sign Out</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          MIIAM Rider v1.0 • {displayRider.joined}
        </p>
      </main>

      {/* Bottom Nav */}
      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider", icon: "map" },
    { name: "Orders", href: "/rider/", icon: "list_alt" },
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