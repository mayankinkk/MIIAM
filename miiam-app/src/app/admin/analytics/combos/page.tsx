"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface ComboStats {
  id: string;
  name: string;
  combo_price: number;
  order_count: number;
  total_revenue: number;
}

export default function ComboAnalytics() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<ComboStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    loadStats();
  }, [supabase, timeRange]);

  async function loadStats() {
    setLoading(true);

    const startDate = new Date();
    if (timeRange === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (timeRange === "30d") startDate.setDate(startDate.getDate() - 30);

    const { data: combos } = await supabase
      .from("combos")
      .select("id, name, combo_price")
      .eq("is_active", true);

    if (!combos) {
      setLoading(false);
      return;
    }

    const statsWithOrders = await Promise.all(
      combos.map(async (combo: { id: string; name: string; combo_price: number }) => {
        const { data: orders } = await supabase
          .from("order_items")
          .select("quantity, total_price")
          .eq("combo_id", combo.id)
          .gte("created_at", startDate.toISOString());

        const orderCount =
          orders?.reduce((sum: number, o: { quantity?: number }) => sum + (o.quantity || 1), 0) ||
          0;
        const totalRevenue =
          orders?.reduce(
            (sum: number, o: { total_price?: number }) => sum + (o.total_price || 0),
            0
          ) || 0;

        return {
          id: combo.id,
          name: combo.name,
          combo_price: combo.combo_price,
          order_count: orderCount,
          total_revenue: totalRevenue,
        };
      })
    );

    setStats(statsWithOrders.sort((a, b) => b.order_count - a.order_count));
    setLoading(false);
  }

  const totalOrders = stats.reduce((sum, s) => sum + s.order_count, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + s.total_revenue, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-surface-container-high h-8 w-48 animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-high h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-on-surface text-2xl font-black">Combo Analytics</h1>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                timeRange === range
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-4">
          <p className="text-on-surface-variant text-xs">Total Orders</p>
          <p className="text-on-surface mt-1 text-2xl font-black">{totalOrders}</p>
        </div>
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-4">
          <p className="text-on-surface-variant text-xs">Total Revenue</p>
          <p className="text-primary mt-1 text-2xl font-black">₹{totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-4">
          <p className="text-on-surface-variant text-xs">Avg Order Value</p>
          <p className="text-on-surface mt-1 text-2xl font-black">₹{avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Combo Performance Table */}
      <div className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="text-on-surface-variant p-4 text-left text-xs font-bold">Combo</th>
              <th className="text-on-surface-variant p-4 text-right text-xs font-bold">Price</th>
              <th className="text-on-surface-variant p-4 text-right text-xs font-bold">Orders</th>
              <th className="text-on-surface-variant p-4 text-right text-xs font-bold">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant/10 divide-y">
            {stats.map((combo) => (
              <tr key={combo.id} className="hover:bg-surface-container">
                <td className="p-4">
                  <p className="text-on-surface text-sm font-bold">{combo.name}</p>
                </td>
                <td className="text-on-surface-variant p-4 text-right text-sm">
                  ₹{combo.combo_price}
                </td>
                <td className="text-on-surface p-4 text-right text-sm font-bold">
                  {combo.order_count}
                </td>
                <td className="text-primary p-4 text-right text-sm font-bold">
                  ₹{combo.total_revenue.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
