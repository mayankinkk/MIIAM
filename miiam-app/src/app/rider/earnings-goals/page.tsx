"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface DeliveryRecord {
  id: string;
  order_id: string;
  amount: number;
  time: string;
  status: string;
}

export default function RiderEarningsGoalsPage() {
  const supabase = createClient();
  const [dailyTarget, setDailyTarget] = useState(1500);
  const [weeklyTarget, setWeeklyTarget] = useState(10000);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalType, setGoalType] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [weeklyDeliveries, setWeeklyDeliveries] = useState(0);
  const [dailyData, setDailyData] = useState<number[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: myRider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!myRider) { setLoading(false); return; }

      // Load saved goals
      const { data: goals } = await supabase
        .from("rider_settings")
        .select("daily_goal, weekly_goal")
        .eq("rider_id", myRider.id)
        .maybeSingle();
      if (goals) {
        if (goals.daily_goal) setDailyTarget(goals.daily_goal);
        if (goals.weekly_goal) setWeeklyTarget(goals.weekly_goal);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, rider_earning, placed_at, status")
        .eq("rider_id", myRider.id)
        .in("status", ["delivered", "completed"])
        .order("placed_at", { ascending: false });

      let totalE = 0;

      if (orders) {
        let dayE = 0, dayD = 0, weekE = 0, weekD = 0;
        const dayMap: Record<string, number> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const recent: DeliveryRecord[] = [];

        orders.forEach(o => {
          const d = new Date(o.placed_at);
          const earn = o.rider_earning || 0;
          totalE += earn;
          if (d >= todayStart) { dayE += earn; dayD++; }
          if (d >= startOfWeek) { weekE += earn; weekD++; }
          const dayKey = dayNames[d.getDay()];
          dayMap[dayKey] = (dayMap[dayKey] || 0) + earn;
          if (recent.length < 10) {
            recent.push({
              id: o.id,
              order_id: o.id,
              amount: earn,
              time: o.placed_at,
              status: o.status,
            });
          }
        });

        setTodayEarnings(dayE);
        setTodayDeliveries(dayD);
        setWeeklyEarnings(weekE);
        setWeeklyDeliveries(weekD);
        setTotalEarnings(totalE);
        setRecentDeliveries(recent);

        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const dd = new Date();
          dd.setDate(today.getDate() - i);
          last7.push(dayMap[dayNames[dd.getDay()]] || 0);
        }
        setDailyData(last7);
      }

      // Fallback: if total is 0, try reading from rider_wallets
      if (totalE === 0) {
        const { data: walletData } = await supabase
          .from("rider_wallets")
          .select("total_earnings")
          .eq("rider_id", myRider.id)
          .maybeSingle();
        if (walletData) {
          setTotalEarnings(Number(walletData.total_earnings) || 0);
        }
      }
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  const dailyProgress = Math.min((todayEarnings / dailyTarget) * 100, 100);
  const weeklyProgress = Math.min((weeklyEarnings / weeklyTarget) * 100, 100);
  const chartMax = Math.max(...dailyData, dailyTarget, 1);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myRider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!myRider) return;

      await supabase.from("rider_settings").upsert({
        rider_id: myRider.id,
        daily_goal: dailyTarget,
        weekly_goal: weeklyTarget,
      }, { onConflict: "rider_id" });
    } catch (err) {
      console.error("Failed to save goals:", err);
    } finally {
      setSavingGoal(false);
      setShowSetGoal(false);
    }
  };

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
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-bold opacity-80 uppercase">Total Earnings (All Time)</p>
          <p className="text-4xl font-black mt-2">₹{totalEarnings.toLocaleString()}</p>
        </div>

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

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Earnings Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-black text-[#0b50d5]">{todayDeliveries}</p>
              <p className="text-xs text-slate-400">Today</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-black text-green-600">{weeklyDeliveries}</p>
              <p className="text-xs text-slate-400">This Week</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-black text-amber-600">
                {todayDeliveries > 0 ? `₹${Math.round(todayEarnings / todayDeliveries)}` : "₹0"}
              </p>
              <p className="text-xs text-slate-400">Avg/Delivery</p>
            </div>
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

        {/* Recent Deliveries */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Recent Deliveries</h3>
          {recentDeliveries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No deliveries yet</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-700">#{d.order_id.slice(0, 6).toUpperCase()}</p>
                    <p className="text-xs text-slate-400">{new Date(d.time).toLocaleDateString()} {new Date(d.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+₹{d.amount}</p>
                </div>
              ))}
            </div>
          )}
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
                    onClick={() => setDailyTarget(amount)}
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
                    onClick={() => setWeeklyTarget(amount)}
                    className={`w-full py-3 rounded-xl font-bold text-sm ${
                      weeklyTarget === amount ? "bg-[#0b50d5] text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={handleSaveGoal}
              disabled={savingGoal}
              className="w-full mt-3 py-3 bg-[#0b50d5] text-white font-bold rounded-xl disabled:opacity-50"
            >
              {savingGoal ? "Saving..." : "Save Goal"}
            </button>
            <button onClick={() => setShowSetGoal(false)} className="w-full mt-2 py-3 text-slate-500 font-bold text-sm rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
