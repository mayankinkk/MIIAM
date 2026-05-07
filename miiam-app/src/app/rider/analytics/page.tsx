"use client";

import { useState } from "react";
import Link from "next/link";

interface DailyStats {
  day: string;
  deliveries: number;
  earnings: number;
  rating: number;
  time: string;
}

const weeklyData: DailyStats[] = [
  { day: "Mon", deliveries: 8, earnings: 420, rating: 4.8, time: "6h 20m" },
  { day: "Tue", deliveries: 12, earnings: 680, rating: 4.9, time: "8h 15m" },
  { day: "Wed", deliveries: 6, earnings: 290, rating: 4.7, time: "4h 45m" },
  { day: "Thu", deliveries: 15, earnings: 850, rating: 4.9, time: "9h 30m" },
  { day: "Fri", deliveries: 10, earnings: 520, rating: 4.8, time: "7h 00m" },
  { day: "Sat", deliveries: 18, earnings: 1020, rating: 4.9, time: "10h 15m" },
  { day: "Sun", deliveries: 14, earnings: 760, rating: 4.8, time: "8h 45m" },
];

const monthlyData = [
  { week: "Week 1", deliveries: 45, earnings: 2400 },
  { week: "Week 2", deliveries: 52, earnings: 2800 },
  { week: "Week 3", deliveries: 38, earnings: 1950 },
  { week: "Week 4", deliveries: 60, earnings: 3200 },
];

const feedbackData = [
  { type: "positive", count: 156, label: "Great Service", icon: "thumb_up" },
  { type: "neutral", count: 28, label: "Average", icon: "remove" },
  { type: "negative", count: 6, label: "Issues", icon: "thumb_down" },
];

const orderTypeData = [
  { type: "Food", percentage: 65, earnings: 6500 },
  { type: "Grocery", percentage: 25, earnings: 2500 },
  { type: "Pharmacy", percentage: 10, earnings: 1000 },
];

const peakHours = [
  { time: "12PM - 2PM", orders: 25, avgEarning: 85 },
  { time: "7PM - 9PM", orders: 32, avgEarning: 95 },
  { time: "9PM - 11PM", orders: 18, avgEarning: 110 },
];

export default function RiderAnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [showExportModal, setShowExportModal] = useState(false);

  const totalDeliveries = weeklyData.reduce((s, d) => s + d.deliveries, 0);
  const totalEarnings = weeklyData.reduce((s, d) => s + d.earnings, 0);
  const avgRating = (weeklyData.reduce((s, d) => s + d.rating, 0) / weeklyData.length).toFixed(1);
  const completionRate = 98.5;
  const avgDeliveryTime = 22;

  const chartMax = Math.max(...weeklyData.map(d => d.earnings));

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
          <button onClick={() => setShowExportModal(true)} className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold mt-4">Analytics</h1>
        <p className="text-sm opacity-70">Track your performance</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Period Selector */}
        <div className="bg-white rounded-xl p-1 flex">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                period === p ? "bg-[#0b50d5] text-white" : "text-slate-500"
              }`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl text-white">
            <p className="text-xs font-bold opacity-80">Total Earnings</p>
            <p className="text-3xl font-black mt-1">₹{totalEarnings.toLocaleString()}</p>
            <p className="text-xs opacity-80 mt-1">+12% vs last {period}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-400">Deliveries</p>
            <p className="text-3xl font-black text-[#0b50d5] mt-1">{totalDeliveries}</p>
            <p className="text-xs text-green-500 mt-1">+8 vs last {period}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-400">Avg Rating</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-3xl font-black text-amber-500">{avgRating}</p>
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <p className="text-xs text-green-500 mt-1">+0.2 vs last {period}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-400">Completion Rate</p>
            <p className="text-3xl font-black text-purple-600 mt-1">{completionRate}%</p>
            <p className="text-xs text-slate-400 mt-1">Top 10% of riders</p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#4d212a]">Daily Earnings</h3>
            <span className="text-xs text-slate-400">₹{Math.round(totalEarnings / totalDeliveries)}/delivery</span>
          </div>
          <div className="h-48 flex items-end gap-2">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-[#0b50d5] to-blue-400 rounded-t-lg relative group cursor-pointer transition-all hover:from-green-500 hover:to-green-400"
                  style={{ height: `${(day.earnings / chartMax) * 100}%`, minHeight: "20px" }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{day.earnings}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">{day.day}</span>
                <span className="text-[8px] text-slate-300">{day.deliveries}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Performance Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">speed</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Avg Delivery Time</p>
                  <p className="text-xs text-slate-400">From pickup to drop</p>
                </div>
              </div>
              <p className="font-black text-[#0b50d5]">{avgDeliveryTime} min</p>
            </div>

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
              <p className="font-black text-green-600">342 km</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600">schedule</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Active Hours</p>
                  <p className="text-xs text-slate-400">This {period}</p>
                </div>
              </div>
              <p className="font-black text-purple-600">54h 30m</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600">local_offer</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Acceptance Rate</p>
                  <p className="text-xs text-slate-400">Orders accepted</p>
                </div>
              </div>
              <p className="font-black text-amber-600">94%</p>
            </div>
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Order Type Breakdown</h3>
          <div className="space-y-3">
            {orderTypeData.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className="w-20 text-xs font-bold text-slate-600">{item.type}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#0b50d5] rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right">
                  <p className="text-xs font-bold">₹{item.earnings}</p>
                  <p className="text-[8px] text-slate-400">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">🔥 Peak Performance Hours</h3>
          <div className="space-y-3">
            {peakHours.map((hour, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div>
                  <p className="font-bold text-sm">{hour.time}</p>
                  <p className="text-xs text-amber-600">{hour.orders} orders • ₹{hour.avgEarning}/order</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-600">₹{hour.orders * hour.avgEarning}</p>
                  <p className="text-[10px] text-amber-500">Total earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Feedback */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Customer Feedback</h3>
          <div className="grid grid-cols-3 gap-3">
            {feedbackData.map((fb) => (
              <div key={fb.type} className="text-center p-3 bg-slate-50 rounded-xl">
                <span className={`material-symbols-outlined text-2xl ${
                  fb.type === "positive" ? "text-green-500" : 
                  fb.type === "neutral" ? "text-slate-400" : "text-red-500"
                }`}>
                  {fb.icon}
                </span>
                <p className="text-2xl font-black mt-1">{fb.count}</p>
                <p className="text-[10px] text-slate-400">{fb.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-3">🏆 Achievements Unlocked</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: "🎯", label: "100 Orders" },
              { icon: "⭐", label: "4.8+ Rating" },
              { icon: "🔥", label: "7 Day Streak" },
              { icon: "💰", label: "₹10K Earned" },
              { icon: "🚀", label: "Fast Delivery" },
            ].map((a, i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                  {a.icon}
                </div>
                <p className="text-[10px] font-bold mt-1 text-purple-700">{a.label}</p>
              </div>
            ))}
          </div>
          <Link href="/rider/achievements" className="block text-center text-xs text-[#0b50d5] font-bold mt-2">
            View All Achievements →
          </Link>
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Export Report</h3>
            <div className="space-y-3">
              <button onClick={() => { alert("PDF report downloading..."); setShowExportModal(false); }} className="w-full p-4 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100">
                <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                <span className="font-bold">Download PDF</span>
              </button>
              <button onClick={() => { alert("CSV exporting..."); setShowExportModal(false); }} className="w-full p-4 bg-slate-50 rounded-xl flex items-center gap-3 hover:bg-slate-100">
                <span className="material-symbols-outlined text-green-500">table_chart</span>
                <span className="font-bold">Export CSV</span>
              </button>
              <button onClick={() => setShowExportModal(false)} className="w-full py-3 text-slate-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}