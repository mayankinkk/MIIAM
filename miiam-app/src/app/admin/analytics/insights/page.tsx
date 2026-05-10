"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface InsightUser {
  id: string;
  email: string;
  full_name: string;
  loyalty_points: number;
  created_at: string;
}

interface InsightOrder {
  id: string;
  user_id: string;
  placed_at: string;
}

export default function CustomerInsights() {
  const supabase = createClient();
  const [users, setUsers] = useState<InsightUser[]>([]);
  const [orders, setOrders] = useState<InsightOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [usersRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("id, user_id, placed_at")
      ]);
      if (usersRes.data) setUsers(usersRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // User metrics
  const newUsersThisMonth = users.filter(u => {
    const created = new Date(u.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return created > monthAgo;
  }).length;

  const totalLoyaltyPoints = users.reduce((s, u) => s + (u.loyalty_points || 0), 0);
  const avgLoyaltyPoints = users.length ? Math.round(totalLoyaltyPoints / users.length) : 0;

  // User segments
  const highValueUsers = users.filter(u => (u.loyalty_points || 0) > 500).length;
  const regularUsers = users.filter(u => (u.loyalty_points || 0) > 100 && (u.loyalty_points || 0) <= 500).length;
  const newUsers = users.filter(u => (u.loyalty_points || 0) <= 100).length;

  // Order frequency
  const userOrderCounts: Record<string, number> = {};
  orders.forEach(o => {
    userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
  });
  
  const frequentBuyers = Object.values(userOrderCounts).filter(c => c > 5).length;
  const occasionalBuyers = Object.values(userOrderCounts).filter(c => c > 1 && c <= 5).length;
  const oneTimeBuyers = Object.values(userOrderCounts).filter(c => c === 1).length;

  // Activity heatmap data (simulated)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activityByHour = hours.map(hour => {
    const count = orders.filter(o => new Date(o.placed_at).getHours() === hour).length;
    return count;
  });
  const maxActivity = Math.max(...activityByHour, 1);

  if (loading) return <div className="px-8">Loading insights...</div>;

  return (
    <div className="px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Customer Insights</h1>
        <p className="text-slate-500">User behavior analytics and segments.</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-3xl font-black text-slate-800">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">New This Month</p>
          <p className="text-3xl font-black text-green-600">+{newUsersThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Loyalty Points</p>
          <p className="text-3xl font-black text-amber-500">{avgLoyaltyPoints}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
          <p className="text-3xl font-black text-slate-800">{totalLoyaltyPoints.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-6">User Segments</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600">workspace_premium</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">High Value (500+ pts)</span>
                  <span className="font-black text-purple-600">{highValueUsers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${(highValueUsers / users.length) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">card_membership</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Regular (100-500 pts)</span>
                  <span className="font-black text-blue-600">{regularUsers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(regularUsers / users.length) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600">person_add</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">New (&lt;100 pts)</span>
                  <span className="font-black text-slate-600">{newUsers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${(newUsers / users.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Frequency */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-6">Purchase Frequency</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600">local_shipping</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Frequent (5+ orders)</span>
                  <span className="font-black text-green-600">{frequentBuyers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(frequentBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600">shopping_bag</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Occasional (2-5 orders)</span>
                  <span className="font-black text-amber-600">{occasionalBuyers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(occasionalBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600">person_off</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">One-time Buyers</span>
                  <span className="font-black text-slate-600">{oneTimeBuyers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${(oneTimeBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6">Order Activity by Hour</h2>
        <div className="flex items-end gap-1 h-40">
          {activityByHour.map((count, hour) => (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-gradient-to-t from-[#ba001c] to-[#ff7670] rounded-t transition-all hover:opacity-80"
                style={{ height: `${(count / maxActivity) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
              />
              {hour % 6 === 0 && (
                <span className="text-[10px] text-slate-400">{hour}:00</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Top Users by Points</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {users.sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0)).slice(0, 10).map((user, i) => (
            <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
              <span className="w-6 h-6 bg-[#ba001c] text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                {user.full_name?.[0] || "U"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-amber-500">{user.loyalty_points || 0} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}