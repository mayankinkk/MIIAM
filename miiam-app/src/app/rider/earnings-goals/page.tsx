"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RiderEarningsGoalsPage() {
  const supabase = createClient();
  const [dailyTarget, setDailyTarget] = useState(1500);
  const [weeklyTarget, setWeeklyTarget] = useState(10000);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalType, setGoalType] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [weeklyDeliveries, setWeeklyDeliveries] = useState(0);
  const [dailyData, setDailyData] = useState<number[]>([]);

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: myRider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!myRider) { setLoading(false); return; }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("rider_earning, placed_at, status")
        .eq("rider_id", myRider.id)
        .in("status", ["delivered", "completed"]);

      if (orders) {
        let dayE = 0, dayD = 0, weekE = 0, weekD = 0;
        const dayMap: Record<string, number> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        orders.forEach(o => {
          const d = new Date(o.placed_at);
          const dayKey = dayNames[d.getDay()];
          const earn = o.rider_earning || 0;
          if (d >= todayStart) { dayE += earn; dayD++; }
          if (d >= startOfWeek) { weekE += earn; weekD++; }
          dayMap[dayKey] = (dayMap[dayKey] || 0) + earn;
        });

        setTodayEarnings(dayE);
        setTodayDeliveries(dayD);
        setWeeklyEarnings(weekE);
        setWeeklyDeliveries(weekD);

        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const dd = new Date();
          dd.setDate(today.getDate() - i);
          last7.push(dayMap[dayNames[dd.getDay()]] || 0);
        }
        setDailyData(last7);
      }
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  const dailyProgress = Math.min((todayEarnings / dailyTarget) * 100, 100);
  const weeklyProgress = Math.min((weeklyEarnings / weeklyTarget) * 100, 100);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartMax = Math.max(...dailyData, dailyTarget, 1);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-12">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Earnings Goals</h1>
        </div>
      </header>

      <main className="px-4 -mt-8 space-y-4 pb-24">
        {/* Daily Goal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800">Daily Goal</h3>
            <button onClick={() => { setGoalType("daily"); setShowSetGoal(true); }} className="text-xs text-[#0b50d5] font-bold">Edit</button>
          </div>
          <p className="text-3xl font-black text-[#0b50d5]">₹{todayEarnings}</p>
          <p className="text-xs text-slate-400">of ₹{dailyTarget}</p>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#0b50d5] to-green-500 rounded-full transition-all" style={{ width: `${dailyProgress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-500">{todayDeliveries} deliveries</span>
            <span className="text-[#0b50d5] font-bold">{Math.round(dailyProgress)}%</span>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800">Weekly Goal</h3>
            <button onClick={() => { setGoalType("weekly"); setShowSetGoal(true); }} className="text-xs text-[#0b50d5] font-bold">Edit</button>
          </div>
          <p className="text-3xl font-black text-green-600">₹{weeklyEarnings}</p>
          <p className="text-xs text-slate-400">of ₹{weeklyTarget}</p>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-amber-400 rounded-full transition-all" style={{ width: `${weeklyProgress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-500">{weeklyDeliveries} deliveries</span>
            <span className="text-green-600 font-bold">{Math.round(weeklyProgress)}%</span>
          </div>
        </div>

        {/* Last 7 Days Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Last 7 Days</h3>
          {dailyData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-4xl">bar_chart</span>
              <p className="text-sm mt-2">No deliveries yet</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-32">
                {dailyData.map((amt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-[#0b50d5]/20 rounded-t-md relative" style={{ height: "100%" }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-[#0b50d5] to-[#4489ff] rounded-t-md transition-all"
                        style={{ height: `${Math.max((amt / chartMax) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <span key={i} className="text-[10px] text-slate-400">{d}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Today's Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Today</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-black text-[#0b50d5]">{todayDeliveries}</p>
              <p className="text-xs text-slate-400">Deliveries</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-black text-green-600">₹{todayEarnings}</p>
              <p className="text-xs text-slate-400">Earned</p>
            </div>
          </div>
        </div>
      </main>

      {/* Set Goal Modal */}
      {showSetGoal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Set {goalType === "daily" ? "Daily" : "Weekly"} Goal</h3>
            <div className="space-y-3">
              {goalType === "daily" ? (
                [500, 1000, 1500, 2000, 2500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => { setDailyTarget(amount); setShowSetGoal(false); }}
                    className={`w-full py-3 rounded-xl font-bold text-sm ${
                      dailyTarget === amount ? "bg-[#0b50d5] text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))
              ) : (
                [5000, 10000, 15000, 20000, 25000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => { setWeeklyTarget(amount); setShowSetGoal(false); }}
                    className={`w-full py-3 rounded-xl font-bold text-sm ${
                      weeklyTarget === amount ? "bg-[#0b50d5] text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowSetGoal(false)} className="w-full mt-3 py-3 text-slate-500 font-bold text-sm rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}