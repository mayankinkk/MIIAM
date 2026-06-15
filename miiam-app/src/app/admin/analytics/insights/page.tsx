"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface InsightUser {
  id: string;
  email: string;
  full_name: string;
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

  // Order frequency
  const userOrderCounts: Record<string, number> = {};
  orders.forEach(o => {
    userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
  });
  
  const frequentBuyers = Object.values(userOrderCounts).filter(c => c > 5).length;
  const regularBuyers = Object.values(userOrderCounts).filter(c => c >= 2 && c <= 5).length;
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
        <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Customer Insights</h1>
        <p className="text-[var(--color-outline)]">User behavior analytics and segments.</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{users.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">New This Month</p>
          <p className="text-3xl font-black text-green-600">+{newUsersThisMonth}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{orders.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Avg Orders/User</p>
          <p className="text-3xl font-black text-amber-500">{users.length > 0 ? Math.round(orders.length / users.length) : 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">User Segments</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600">local_shipping</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">Frequent Buyers (&gt;5 orders)</span>
                  <span className="font-black text-purple-600">{frequentBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${(frequentBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">card_membership</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">Regular (2-5 orders)</span>
                  <span className="font-black text-blue-600">{regularBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(regularBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">person_off</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">One-time Buyers</span>
                  <span className="font-black text-[var(--color-on-surface-variant)]">{oneTimeBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${(oneTimeBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Frequency */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Purchase Frequency</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600">local_shipping</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">Frequent (5+ orders)</span>
                  <span className="font-black text-green-600">{frequentBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
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
                  <span className="font-bold text-[var(--color-on-surface)]">Occasional (2-5 orders)</span>
                  <span className="font-black text-amber-600">{regularBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(regularBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">person_off</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">One-time Buyers</span>
                  <span className="font-black text-[var(--color-on-surface-variant)]">{oneTimeBuyers}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400" style={{ width: `${(oneTimeBuyers / (users.length || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Order Activity by Hour</h2>
        <div className="flex items-end gap-1 h-40">
          {activityByHour.map((count, hour) => (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-gradient-to-t from-[var(--color-primary)] to-[#ff7670] rounded-t transition-all hover:opacity-80"
                style={{ height: `${(count / maxActivity) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
              />
              {hour % 6 === 0 && (
                <span className="text-[10px] text-[var(--color-outline-variant)]">{hour}:00</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Users by Orders */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Top Users by Orders</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {users.sort((a, b) => (userOrderCounts[b.id] || 0) - (userOrderCounts[a.id] || 0)).slice(0, 10).map((user, i) => (
            <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-[var(--color-surface-subtle)]">
              <span className="w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center font-bold text-[var(--color-on-surface-variant)]">
                {user.full_name?.[0] || "U"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)]">{user.full_name}</p>
                <p className="text-xs text-[var(--color-outline-variant)]">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-amber-500">{userOrderCounts[user.id] || 0} orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}