"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const menuItems = [
  { id: "orders", icon: "receipt_long", label: "My Orders", sub: "View all orders", color: "text-blue-500", bg: "bg-blue-50" },
  { id: "bookings", icon: "calendar_month", label: "Bookings", sub: "Service appointments", color: "text-amber-500", bg: "bg-amber-50" },
  { id: "addresses", icon: "location_on", label: "Saved Addresses", sub: "Manage delivery addresses", color: "text-green-500", bg: "bg-green-50" },
  { id: "favorites", icon: "favorite", label: "Favorites", sub: "Your saved items", color: "text-red-500", bg: "bg-red-50" },
  { id: "payment", icon: "payment", label: "Payment Methods", sub: "Cards, UPI, wallets", color: "text-purple-500", bg: "bg-purple-50" },
  { id: "referral", icon: "card_membership", label: "Refer & Earn", sub: "Share code & earn points", color: "text-[#ba001c]", bg: "bg-[#ffe1e4]" },
  { id: "subscription", icon: "workspace_premium", label: "MIIAM+", sub: "Premium membership", color: "text-amber-500", bg: "bg-amber-50", badge: "ACTIVE" },
  { id: "support", icon: "support_agent", label: "Help & Support", sub: "24/7 customer care", color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "settings", icon: "settings", label: "Settings", sub: "App preferences", color: "text-slate-500", bg: "bg-slate-50" },
];

export default function EnhancedProfilePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, reviews: 0, saved: 0 });

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Fetch real stats
        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        const { count: reviewCount } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        const { count: favCount } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        setStats({
          orders: orderCount || 0,
          reviews: reviewCount || 0,
          saved: favCount || 0
        });
      }
    }
    loadUserAndProfile();
  }, [supabase]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#ba001c] to-[#ff7670] text-white p-6 pb-12 rounded-b-[3rem]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">My Profile</h1>
          <Link href="/app/profile/edit" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black border-4 border-white/30">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-2xl font-black">{displayName}</h2>
            <p className="text-white/80 text-sm">{user?.email}</p>
            {profile?.phone && <p className="text-white/60 text-sm">{profile.phone}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                MIIAM+ Member
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.orders}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">Orders</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.reviews}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">Reviews</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.saved}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">Saved</p>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="px-6 -mt-6 space-y-4">
        {/* MIIAM+ Promo */}
        <Link href="/app/subscription" className="block bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <div>
                <p className="font-bold">Upgrade to MIIAM+</p>
                <p className="text-xs text-white/80">Free delivery & 20% off</p>
              </div>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </Link>

        

        {/* Menu Sections */}
        <div className="space-y-2">
          {menuItems.slice(0, 4).map((item) => (
            <Link key={item.id} href={`/app/${item.id}`} className="block bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Second Section */}
        <div className="space-y-2">
          {menuItems.slice(4, 8).map((item) => (
            <Link key={item.id} href={`/app/${item.id}`} className="block bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="bg-green-100 text-green-700 text-[8px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Settings Section */}
        <div className="space-y-2">
          {menuItems.slice(8).map((item) => (
            <Link key={item.id} href={`/app/${item.id}`} className="block bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:bg-red-50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100">
            <span className="material-symbols-outlined text-red-500">logout</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-600">Log Out</p>
            <p className="text-xs text-slate-500">Sign out of your account</p>
          </div>
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-slate-400 py-6">
          MIIAM v2.5.0 • Made with ❤️ in India
        </p>
      </main>
    </div>
  );
}