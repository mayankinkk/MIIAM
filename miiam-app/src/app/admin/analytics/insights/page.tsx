"use client";

export const dynamic = "force-dynamic";

import { useMemo, useEffect, useState } from "react";
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

interface InsightBooking {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
  amount: number | null;
}

export default function CustomerInsights() {
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<InsightUser[]>([]);
  const [orders, setOrders] = useState<InsightOrder[]>([]);
  const [bookings, setBookings] = useState<InsightBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [usersRes, ordersRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("id, user_id, placed_at"),
        supabase.from("service_bookings").select("id, service_type, status, created_at, amount"),
      ]);
      if (usersRes.data) setUsers(usersRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // User metrics
  const newUsersThisMonth = users.filter((u) => {
    const created = new Date(u.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return created > monthAgo;
  }).length;

  // Order frequency
  const userOrderCounts: Record<string, number> = {};
  orders.forEach((o) => {
    userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
  });

  const frequentBuyers = Object.values(userOrderCounts).filter((c) => c > 5).length;
  const regularBuyers = Object.values(userOrderCounts).filter((c) => c >= 2 && c <= 5).length;
  const oneTimeBuyers = Object.values(userOrderCounts).filter((c) => c === 1).length;

  // Activity heatmap data (simulated)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activityByHour = hours.map((hour) => {
    const count = orders.filter((o) => new Date(o.placed_at).getHours() === hour).length;
    return count;
  });
  const maxActivity = Math.max(...activityByHour, 1);

  // Services analytics — booking conversion / completion per service type
  const serviceTypes = useMemo(() => {
    const map: Record<
      string,
      { total: number; completed: number; cancelled: number; active: number; revenue: number }
    > = {};
    bookings.forEach((b) => {
      if (!map[b.service_type])
        map[b.service_type] = { total: 0, completed: 0, cancelled: 0, active: 0, revenue: 0 };
      map[b.service_type].total += 1;
      if (b.status === "completed") {
        map[b.service_type].completed += 1;
        map[b.service_type].revenue += b.amount || 0;
      } else if (b.status === "cancelled") {
        map[b.service_type].cancelled += 1;
      } else {
        map[b.service_type].active += 1;
      }
    });
    return map;
  }, [bookings]);

  const maxServiceTotal = Math.max(...Object.values(serviceTypes).map((s) => s.total), 1);
  const overallCompletionRate =
    bookings.length > 0
      ? Math.round(
          (bookings.filter((b) => b.status === "completed").length / bookings.length) * 100
        )
      : 0;

  if (loading) return <div className="px-8">Loading insights...</div>;

  return (
    <div className="space-y-8 px-8">
      <div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Customer Insights
        </h1>
        <p className="text-[var(--color-outline)]">User behavior analytics and segments.</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total Users
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{users.length}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            New This Month
          </p>
          <p className="text-3xl font-black text-green-600">+{newUsersThisMonth}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total Orders
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{orders.length}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Avg Orders/User
          </p>
          <p className="text-3xl font-black text-amber-500">
            {users.length > 0 ? Math.round(orders.length / users.length) : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Segments */}
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">User Segments</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-accent">local_shipping</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">
                    Frequent Buyers (&gt;5 orders)
                  </span>
                  <span className="text-accent font-black">{frequentBuyers}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="bg-accent h-full"
                    style={{ width: `${(frequentBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-accent">card_membership</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">
                    Regular (2-5 orders)
                  </span>
                  <span className="text-accent font-black">{regularBuyers}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="bg-accent h-full"
                    style={{ width: `${(regularBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  person_off
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">One-time Buyers</span>
                  <span className="font-black text-[var(--color-on-surface-variant)]">
                    {oneTimeBuyers}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${(oneTimeBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Frequency */}
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
            Purchase Frequency
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <span className="material-symbols-outlined text-green-600">local_shipping</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">
                    Frequent (5+ orders)
                  </span>
                  <span className="font-black text-green-600">{frequentBuyers}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(frequentBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <span className="material-symbols-outlined text-amber-600">shopping_bag</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">
                    Occasional (2-5 orders)
                  </span>
                  <span className="font-black text-amber-600">{regularBuyers}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(regularBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  person_off
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--color-on-surface)]">One-time Buyers</span>
                  <span className="font-black text-[var(--color-on-surface-variant)]">
                    {oneTimeBuyers}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${(oneTimeBuyers / (users.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Analytics — booking conversion & completion by type */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-[var(--color-on-surface)]">
            Services — Booking Conversion
          </h2>
          <div className="text-right">
            <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
              Overall Completion
            </p>
            <p className="text-xl font-black text-green-600">{overallCompletionRate}%</p>
          </div>
        </div>
        {Object.keys(serviceTypes).length === 0 ? (
          <p className="py-8 text-center text-[var(--color-outline-variant)]">
            No service bookings yet
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(serviceTypes)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([type, s]) => {
                const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                const cancelRate = s.total > 0 ? Math.round((s.cancelled / s.total) * 100) : 0;
                return (
                  <div
                    key={type}
                    className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent text-lg">
                          home_repair_service
                        </span>
                        <span className="font-bold text-[var(--color-on-surface)] capitalize">
                          {type.replaceAll("_", " ")}
                        </span>
                      </div>
                      <span className="text-sm font-black text-[var(--color-on-surface)]">
                        ₹{s.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-outline)]">
                      <span>{s.total} bookings</span>
                      <span className="font-bold text-green-600">
                        {s.completed} completed ({completionRate}%)
                      </span>
                      <span className="text-amber-600">{s.active} active</span>
                      <span className="text-red-600">
                        {s.cancelled} cancelled ({cancelRate}%)
                      </span>
                    </div>
                    {/* completion bar */}
                    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(s.completed / maxServiceTotal) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${(s.active / maxServiceTotal) * 100}%` }}
                      />
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${(s.cancelled / maxServiceTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--color-outline-variant)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Cancelled
          </span>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
          Order Activity by Hour
        </h2>
        <div className="flex h-40 items-end gap-1">
          {activityByHour.map((count, hour) => (
            <div key={hour} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-[var(--color-primary)] to-[#ff7670] transition-all hover:opacity-80"
                style={{
                  height: `${(count / maxActivity) * 100}%`,
                  minHeight: count > 0 ? "4px" : "0",
                }}
              />
              {hour % 6 === 0 && (
                <span className="text-[10px] text-[var(--color-outline-variant)]">{hour}:00</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Users by Orders */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-[var(--color-border-subtle)] p-4">
          <h2 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            Top Users by Orders
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {users
            .sort((a, b) => (userOrderCounts[b.id] || 0) - (userOrderCounts[a.id] || 0))
            .slice(0, 10)
            .map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-subtle)]"
              >
                <span className="text-on-primary flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] font-bold text-[var(--color-on-surface-variant)]">
                  {user.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-on-surface)]">{user.full_name}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-500">
                    {userOrderCounts[user.id] || 0} orders
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
