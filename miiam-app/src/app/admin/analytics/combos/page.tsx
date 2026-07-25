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
      combos.map(async (combo) => {
        const { data: orders } = await supabase
          .from("order_items")
          .select("quantity, total_price")
          .eq("combo_id", combo.id)
          .gte("created_at", startDate.toISOString());

        const orderCount = orders?.reduce((sum, o) => sum + (o.quantity || 1), 0) || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

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
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-surface-container-high animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-container-high animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-on-surface">Combo Analytics</h1>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                timeRange === range
                  ? "bg-primary text-white"
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
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">Total Orders</p>
          <p className="text-2xl font-black text-on-surface mt-1">{totalOrders}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">Total Revenue</p>
          <p className="text-2xl font-black text-primary mt-1">₹{totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10">
          <p className="text-xs text-on-surface-variant">Avg Order Value</p>
          <p className="text-2xl font-black text-on-surface mt-1">₹{avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Combo Performance Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="p-4 text-left text-xs font-bold text-on-surface-variant">Combo</th>
              <th className="p-4 text-right text-xs font-bold text-on-surface-variant">Price</th>
              <th className="p-4 text-right text-xs font-bold text-on-surface-variant">Orders</th>
              <th className="p-4 text-right text-xs font-bold text-on-surface-variant">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {stats.map((combo) => (
              <tr key={combo.id} className="hover:bg-surface-container">
                <td className="p-4">
                  <p className="font-bold text-sm text-on-surface">{combo.name}</p>
                </td>
                <td className="p-4 text-right text-sm text-on-surface-variant">₹{combo.combo_price}</td>
                <td className="p-4 text-right text-sm font-bold text-on-surface">{combo.order_count}</td>
                <td className="p-4 text-right text-sm font-bold text-primary">₹{combo.total_revenue.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}