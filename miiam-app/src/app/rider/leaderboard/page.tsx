"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RiderLeaderboardPage() {
  const supabase = createClient();
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [riders, setRiders] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: myRider } = await supabase.from("riders").select("*").eq("user_id", user.id).single();
      setMyStats(myRider);

      const startDate = new Date();
      if (period === "today") startDate.setHours(0, 0, 0, 0);
      else if (period === "week") startDate.setDate(startDate.getDate() - 7);
      else startDate.setMonth(startDate.getMonth() - 1);

      const { data: delivered } = await supabase
        .from("orders")
        .select("rider_id, rider_earning, delivered_at")
        .eq("status", "delivered")
        .gte("delivered_at", startDate.toISOString());

      const statsMap: Record<string, { deliveries: number; earnings: number }> = {};
      delivered?.forEach(order => {
        if (!order.rider_id) return;
        if (!statsMap[order.rider_id]) statsMap[order.rider_id] = { deliveries: 0, earnings: 0 };
        statsMap[order.rider_id].deliveries++;
        statsMap[order.rider_id].earnings += order.rider_earning || 0;
      });

      const { data: allRiders } = await supabase.from("riders").select("*");
      const leaderboard = allRiders?.map(r => ({
        id: r.id,
        name: r.name || "Rider",
        avatar: (r.name || "R")[0].toUpperCase(),
        deliveries: statsMap[r.id]?.deliveries || 0,
        earnings: statsMap[r.id]?.earnings || 0,
        rating: r.rating || 5.0,
        isMe: r.id === myRider?.id,
      })).sort((a, b) => b.deliveries - a.deliveries) || [];

      setRiders(leaderboard);
      setLoading(false);
    }
    loadLeaderboard();
  }, [period, supabase]);

  const myRank = riders.findIndex(r => r.isMe) + 1;
  const top3 = riders.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-12">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Leaderboard</h1>
        </div>

        <div className="flex gap-2 mt-6 bg-white/10 p-1 rounded-xl">
          {(["today", "week", "month"] as const).map(p => (
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

      <main className="px-4 -mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : riders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center mt-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">emoji_events</span>
            <p className="text-sm text-slate-500 mt-2">No deliveries yet this {period}. Start delivering!</p>
          </div>
        ) : (
          <>
            {/* My Rank Card */}
            {myStats && (
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0b50d5] text-white flex items-center justify-center text-xl font-black">
                  #{myRank}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">Your Position</p>
                  <p className="text-xs text-slate-400">This {period}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#0b50d5]">{myStats.total_deliveries || 0}</p>
                  <p className="text-[10px] text-slate-400">deliveries</p>
                </div>
              </div>
            )}

            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-2 mb-6">
              {top3.length > 1 && (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-black text-lg mb-1">
                    {top3[1].avatar}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{top3[1].name}</p>
                  <p className="text-[10px] text-slate-400">{top3[1].deliveries}</p>
                  <div className="w-16 bg-slate-300 rounded-t-xl text-center py-3 text-xs font-black text-slate-500">2nd</div>
                </div>
              )}
              {top3.length > 0 && (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400 text-white flex items-center justify-center font-black text-2xl mb-1 shadow-lg">
                    {top3[0].avatar}
                  </div>
                  <p className="text-sm font-bold text-slate-700">{top3[0].name}</p>
                  <p className="text-xs text-slate-400">{top3[0].deliveries} deliveries</p>
                  <div className="w-20 bg-yellow-400 rounded-t-xl text-center py-4 text-sm font-black text-white">1st 🥇</div>
                </div>
              )}
              {top3.length > 2 && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-sm mb-1">
                    {top3[2].avatar}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">{top3[2].name}</p>
                  <p className="text-[9px] text-slate-400">{top3[2].deliveries}</p>
                  <div className="w-14 bg-amber-600 rounded-t-xl text-center py-2 text-[10px] font-black text-white">3rd</div>
                </div>
              )}
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-2 pb-8">
              {riders.map((rider, index) => (
                <div key={rider.id} className={`bg-white rounded-xl p-4 flex items-center gap-3 ${rider.isMe ? "ring-2 ring-[#0b50d5]" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${rider.isMe ? "bg-[#0b50d5] text-white" : "bg-slate-100 text-slate-600"}`}>
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#0b50d5]/10 text-[#0b50d5] flex items-center justify-center font-black">
                    {rider.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{rider.name} {rider.isMe && <span className="text-[#0b50d5] text-xs">(You)</span>}</p>
                    <p className="text-xs text-slate-400">{rider.rating.toFixed(1)} ★ • {rider.deliveries} deliveries</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600">₹{rider.earnings}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}