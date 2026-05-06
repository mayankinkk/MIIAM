"use client";

import { useState } from "react";
import Link from "next/link";

const dailyGoal = 1500;
const weeklyGoal = 10000;

export default function RiderEarningsGoalsPage() {
  const [dailyTarget, setDailyTarget] = useState(dailyGoal);
  const [weeklyTarget, setWeeklyTarget] = useState(weeklyGoal);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalType, setGoalType] = useState<"daily" | "weekly">("daily");

  const todayEarnings = 340;
  const todayDeliveries = 8;
  const todayTime = "4h 32m";
  
  const weeklyEarnings = 2450;
  const weeklyDeliveries = 52;

  const dailyProgress = (todayEarnings / dailyTarget) * 100;
  const weeklyProgress = (weeklyEarnings / weeklyTarget) * 100;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyData = [420, 680, 290, 850, 520, 0, 0];

  const activeBonuses = [
    { name: "Morning Rush", progress: 75, bonus: 150, max: 200 },
    { name: "Complete 50 orders", progress: 52, bonus: 500, max: 500 },
    { name: "Peak Hours Bonus", progress: 100, bonus: 180, max: 180 },
  ];

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

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Daily Goal */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">flag</span>
              <h3 className="font-bold text-[#4d212a]">Daily Goal</h3>
            </div>
            <button onClick={() => { setGoalType("daily"); setShowSetGoal(true); }} className="text-[#0b50d5] text-sm font-bold">Edit</button>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-4xl font-black text-green-600">₹{todayEarnings}</p>
            <p className="text-sm text-slate-400">of ₹{dailyTarget} target</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">{dailyProgress.toFixed(0)}% completed</p>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="font-bold text-[#0b50d5]">{todayDeliveries}</p>
              <p className="text-xs text-slate-400">Deliveries</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="font-bold text-purple-600">₹{(todayEarnings / todayDeliveries).toFixed(0)}</p>
              <p className="text-xs text-slate-400">Avg/Order</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="font-bold text-amber-600">{todayTime}</p>
              <p className="text-xs text-slate-400">Time Online</p>
            </div>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">calendar_month</span>
              <h3 className="font-bold text-[#4d212a]">Weekly Goal</h3>
            </div>
            <button onClick={() => { setGoalType("weekly"); setShowSetGoal(true); }} className="text-[#0b50d5] text-sm font-bold">Edit</button>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-4xl font-black text-blue-600">₹{weeklyEarnings}</p>
            <p className="text-sm text-slate-400">of ₹{weeklyTarget} target</p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">{weeklyProgress.toFixed(0)}% completed</p>

          <div className="flex justify-between items-end mt-4">
            {dailyData.map((earn, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${(earn / 1000) * 60}px`, minHeight: "4px" }}
                />
                <span className="text-[9px] text-slate-400 mt-1">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Bonuses */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">celebration</span>
            <h3 className="font-bold text-[#4d212a]">Active Bonuses</h3>
          </div>
          
          <div className="space-y-4">
            {activeBonuses.map((bonus, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{bonus.name}</span>
                  <span className="text-xs text-green-600 font-bold">₹{bonus.bonus}/₹{bonus.max}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${bonus.progress >= 100 ? "bg-green-500" : "bg-amber-400"}`}
                    style={{ width: `${bonus.progress}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  {bonus.progress >= 100 ? "Completed! 🎉" : `${bonus.progress}% complete`}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm">
            + Add More Challenges
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-4">💡 Tips to Reach Your Goal</h3>
          <ul className="space-y-2 text-sm text-purple-700">
            <li>• Work during peak hours (12-2 PM, 7-9 PM) for 1.5x earnings</li>
            <li>• Complete 15 deliveries this week for ₹500 bonus</li>
            <li>• Accept multi-stop orders for higher payouts</li>
          </ul>
        </div>
      </main>

      {/* Set Goal Modal */}
      {showSetGoal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Set {goalType === "daily" ? "Daily" : "Weekly"} Goal</h3>
            
            <div className="space-y-3 mb-4">
              {[1000, 1500, 2000, 2500].map(amount => (
                <button
                  key={amount}
                  onClick={() => goalType === "daily" ? setDailyTarget(amount) : setWeeklyTarget(amount)}
                  className={`w-full py-3 rounded-xl font-bold border-2 ${
                    (goalType === "daily" ? dailyTarget : weeklyTarget) === amount
                      ? "border-[#0b50d5] bg-blue-50 text-[#0b50d5]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowSetGoal(false)}
              className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      <RiderNavBar />
    </div>
  );
}

function RiderNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      <Link href="/rider/dashboard" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">map</span>
        <span className="text-[10px] font-bold">Map</span>
      </Link>
      <Link href="/rider/orders" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">list_alt</span>
        <span className="text-[10px] font-bold">Orders</span>
      </Link>
      <Link href="/rider/wallet" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
        <span className="text-[10px] font-bold">Wallet</span>
      </Link>
      <Link href="/rider/account" className="flex flex-col items-center p-2 text-[#0b50d5]">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        <span className="text-[10px] font-bold">Account</span>
      </Link>
    </nav>
  );
}