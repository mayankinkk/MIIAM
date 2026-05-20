"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface DailyStats {
  day: string;
  deliveries: number;
  earnings: number;
  rating: number;
  time: string;
}

export default function RiderAnalyticsPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [rider, setRider] = useState<any>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: myRider } = await supabase.from("riders").select("*").eq("user_id", user.id).single();
      setRider(myRider);

      const days = period === "week" ? 7 : period === "month" ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total_amount, delivery_fee, placed_at, delivered_at, rating, rider_earning")
        .eq("rider_id", myRider?.id)
        .gte("placed_at", startDate.toISOString())
        .in("status", ["delivered", "completed"]);

      if (orders && orders.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dailyMap: Record<string, { deliveries: number; earnings: number; ratings: number[] }> = {};
        
        orders.forEach(order => {
          const date = new Date(order.placed_at);
          const dayKey = dayNames[date.getDay()];
          if (!dailyMap[dayKey]) {
            dailyMap[dayKey] = { deliveries: 0, earnings: 0, ratings: [] };
          }
          dailyMap[dayKey].deliveries += 1;
          dailyMap[dayKey].earnings += (order.rider_earning || order.delivery_fee || 0);
          if (order.rating) dailyMap[dayKey].ratings.push(order.rating);
        });

        const data = dayNames.map(day => {
          const d = dailyMap[day] || { deliveries: 0, earnings: 0, ratings: [] };
          const avgRating = d.ratings.length > 0 
            ? d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length 
            : 5.0;
          return {
            day,
            deliveries: d.deliveries,
            earnings: d.earnings,
            rating: parseFloat(avgRating.toFixed(1)),
            time: `${Math.round(d.deliveries * 0.5)}h ${Math.round((d.deliveries * 0.5) * 60 % 60)}m`
          };
        });
        setWeeklyData(data);
      } else {
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        setWeeklyData(dayNames.map(day => ({
          day,
          deliveries: 0,
          earnings: 0,
          rating: 5.0,
          time: "0h 0m"
        })));
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, [period, supabase]);

  const totalDeliveries = weeklyData.reduce((s, d) => s + d.deliveries, 0);
  const totalEarnings = weeklyData.reduce((s, d) => s + d.earnings, 0);
  const avgRating = rider?.rating?.toFixed(1) || "5.0";

  const chartMax = Math.max(...weeklyData.map(d => d.earnings), 1);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-12">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Analytics</h1>
        </div>

        <div className="flex gap-2 mt-6 bg-white/10 p-1 rounded-xl">
          {(["week", "month", "year"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                period === p ? "bg-white text-[#0b50d5]" : "text-white/70"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-8 space-y-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400">Total Deliveries</p>
                <p className="text-3xl font-black text-[#0b50d5] mt-1">{totalDeliveries}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400">Total Earnings</p>
                <p className="text-3xl font-black text-green-600">₹{totalEarnings}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400">Avg Rating</p>
                <p className="text-3xl font-black text-amber-500">{avgRating} ★</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400">Avg Earning/Delivery</p>
                <p className="text-3xl font-black text-[#0b50d5]">
                  {totalDeliveries > 0 ? `₹${Math.round(totalEarnings / totalDeliveries)}` : "₹0"}
                </p>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Earnings This {period.charAt(0).toUpperCase() + period.slice(1)}</h3>
              {totalEarnings === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl">bar_chart</span>
                  <p className="text-sm mt-2">No deliveries yet this {period}</p>
                </div>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-[#0b50d5]/20 rounded-t-md relative" style={{ height: "100%" }}>
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-[#0b50d5] to-[#4489ff] rounded-t-md transition-all"
                          style={{ height: `${Math.max((d.earnings / chartMax) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-2">
                {weeklyData.map((d, i) => (
                  <span key={i} className="text-[10px] text-slate-400">{d.day}</span>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">route</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Total Distance</p>
                    <p className="text-xs text-slate-400">This {period}</p>
                  </div>
                </div>
                <p className="font-black text-green-600">{totalDeliveries * 3} km</p>
              </div>

              
            </div>

            {/* Rating Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Rating Breakdown</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-black text-amber-500">{avgRating}</p>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{rider?.total_deliveries || 0} ratings</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}