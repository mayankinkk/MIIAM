"use client";

import { useState } from "react";
import Link from "next/link";

interface Rider {
  id: string;
  name: string;
  avatar: string;
  deliveries: number;
  earnings: number;
  rating: number;
  isMe: boolean;
}

const mockLeaderboard: Rider[] = [
  { id: "1", name: "Rahul S.", avatar: "R", deliveries: 156, earnings: 12450, rating: 4.9, isMe: false },
  { id: "2", name: "Amit K.", avatar: "A", deliveries: 142, earnings: 11200, rating: 4.8, isMe: false },
  { id: "3", name: "Vikram P.", avatar: "V", deliveries: 138, earnings: 10800, rating: 4.7, isMe: false },
  { id: "4", name: "Sanjay M.", avatar: "S", deliveries: 125, earnings: 9800, rating: 4.6, isMe: false },
  { id: "5", name: "You", avatar: "D", deliveries: 98, earnings: 7650, rating: 4.8, isMe: true },
  { id: "6", name: "Priya S.", avatar: "P", deliveries: 89, earnings: 6900, rating: 4.5, isMe: false },
  { id: "7", name: "Kunal J.", avatar: "K", deliveries: 82, earnings: 6400, rating: 4.4, isMe: false },
];

const dailyTarget = 1500;
const weeklyTarget = 10000;

export default function RiderLeaderboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const myRank = 5;
  const top3 = mockLeaderboard.slice(0, 3);

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
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* My Stats Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#0b50d5] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                D
              </div>
              <div>
                <p className="font-bold text-lg text-[#4d212a]">You</p>
                <p className="text-sm text-slate-400">Rank #{myRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-green-600">₹7,650</p>
              <p className="text-xs text-slate-400">This Week</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xl font-black text-[#0b50d5]">98</p>
              <p className="text-xs text-slate-400">Deliveries</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xl font-black text-amber-500">4.8</p>
              <p className="text-xs text-slate-400">Rating</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xl font-black text-purple-600">₹78</p>
              <p className="text-xs text-slate-400">Avg/Order</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-4">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 text-xl font-bold mx-auto mb-2">
              {top3[1].avatar}
            </div>
            <p className="font-bold text-sm">{top3[1].name}</p>
            <p className="text-xs text-slate-400">#{2}</p>
            <div className="bg-slate-200 h-24 w-16 rounded-t-xl mt-2 flex items-center justify-center">
              <p className="text-xs font-bold">₹{top3[1].earnings}</p>
            </div>
          </div>
          
          {/* 1st Place */}
          <div className="text-center">
            <span className="material-symbols-outlined text-yellow-400 text-4xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto border-4 border-yellow-200">
              {top3[0].avatar}
            </div>
            <p className="font-bold mt-2">{top3[0].name}</p>
            <p className="text-xs text-slate-400">#{1}</p>
            <div className="bg-yellow-400 h-32 w-20 rounded-t-xl mt-2 flex items-center justify-center text-white">
              <p className="text-sm font-bold">₹{top3[0].earnings}</p>
            </div>
          </div>
          
          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-14 h-14 bg-orange-300 rounded-full flex items-center justify-center text-orange-800 text-xl font-bold mx-auto mb-2">
              {top3[2].avatar}
            </div>
            <p className="font-bold text-sm">{top3[2].name}</p>
            <p className="text-xs text-slate-400">#{3}</p>
            <div className="bg-orange-200 h-20 w-16 rounded-t-xl mt-2 flex items-center justify-center">
              <p className="text-xs font-bold">₹{top3[2].earnings}</p>
            </div>
          </div>
        </div>

        {/* Full Rankings */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">All Riders</h3>
          <div className="space-y-3">
            {mockLeaderboard.map((rider, index) => (
              <div key={rider.id} className={`flex items-center gap-3 p-3 rounded-xl ${rider.isMe ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}>
                <span className="font-bold text-slate-400 w-6">{index + 1}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${rider.isMe ? "bg-[#0b50d5]" : "bg-slate-400"}`}>
                  {rider.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{rider.name}</p>
                  <p className="text-xs text-slate-400">{rider.deliveries} deliveries</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${rider.isMe ? "text-green-600" : "text-slate-600"}`}>₹{rider.earnings}</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs text-slate-400">{rider.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">🏆 Your Achievements</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
              <p className="text-xs font-bold mt-1">7-Day Streak</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl">bolt</span>
              <p className="text-xs font-bold mt-1">Peak Master</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              <p className="text-xs font-bold mt-1">Gold Tier</p>
            </div>
          </div>
        </div>
      </main>

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