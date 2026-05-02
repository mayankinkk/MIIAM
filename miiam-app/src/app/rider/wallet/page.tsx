"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  type: "advance" | "expense" | "payout" | "earning";
  description: string;
  created_at: string;
  order_id: string | null;
}

interface DailyEarning {
  date: string;
  deliveries: number;
  earnings: number;
  avgPerDelivery: number;
}

export default function RiderWalletPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "earnings" | "payouts">("wallet");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const mockWallet = {
    balance: 2500,
    pendingPayout: 450,
    totalEarnings: 12500,
    advanceUsed: 3200,
  };

  const weeklyEarnings: DailyEarning[] = [
    { date: "Mon", deliveries: 8, earnings: 420, avgPerDelivery: 52.5 },
    { date: "Tue", deliveries: 12, earnings: 680, avgPerDelivery: 56.67 },
    { date: "Wed", deliveries: 6, earnings: 290, avgPerDelivery: 48.33 },
    { date: "Thu", deliveries: 15, earnings: 850, avgPerDelivery: 56.67 },
    { date: "Fri", deliveries: 10, earnings: 520, avgPerDelivery: 52 },
    { date: "Sat", deliveries: 18, earnings: 1020, avgPerDelivery: 56.67 },
    { date: "Sun", deliveries: 14, earnings: 760, avgPerDelivery: 54.29 },
  ];

  const totalWeekEarnings = weeklyEarnings.reduce((s, d) => s + d.earnings, 0);
  const totalDeliveries = weeklyEarnings.reduce((s, d) => s + d.deliveries, 0);

  useEffect(() => {
    loadTransactions();
  }, [supabase]);

  async function loadTransactions() {
    const { data } = await supabase
      .from("rider_wallet")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
    setLoading(false);
  }

  async function requestPayout(amount: number) {
    alert(`Payout request of ₹${amount} submitted!`);
  }

  const mockTransactions = [
    { id: "1", amount: 150, type: "earning", description: "Order #1234 delivery", created_at: new Date().toISOString() },
    { id: "2", amount: -80, type: "expense", description: "Advance for Order #1235", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "3", amount: 200, type: "earning", description: "Order #1230 delivery", created_at: new Date(Date.now() - 7200000).toISOString() },
  ];

  const displayTxns = transactions.length > 0 ? transactions : mockTransactions;

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-12 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>

        {activeTab === "wallet" && (
          <>
            <div className="mt-8 text-center">
              <p className="text-sm opacity-70 mb-1">Available Balance</p>
              <p className="text-5xl font-black">₹{mockWallet.balance.toLocaleString()}</p>
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => requestPayout(500)}
                className="flex-1 bg-white text-[#0b50d5] py-3 rounded-xl font-bold"
              >
                Request Payout
              </button>
              <button className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold">
                Add Money
              </button>
            </div>
          </>
        )}
      </header>

      <main className="px-6 -mt-6 space-y-6 pb-32">
        <div className="bg-white rounded-2xl p-1 flex">
          {(["wallet", "earnings", "payouts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-[#0b50d5] text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "wallet" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
                <p className="text-xs text-slate-400 uppercase">Total Earned</p>
                <p className="text-xl font-black text-green-600">₹{mockWallet.totalEarnings}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
                <p className="text-xs text-slate-400 uppercase">Advance Used</p>
                <p className="text-xl font-black text-amber-600">₹{mockWallet.advanceUsed}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
                <p className="text-xs text-slate-400 uppercase">Pending</p>
                <p className="text-xl font-black text-slate-400">₹{mockWallet.pendingPayout}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <div>
                  <p className="font-bold text-blue-800 text-sm">How it works</p>
                  <p className="text-xs text-blue-600 mt-1">
                    When you accept an order, you'll receive an advance to pay the vendor. 
                    Track your expenses and earnings here. Collect delivery payment from customers if needed.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#4d212a]">Recent Transactions</h2>
            
            <div className="space-y-3">
              {displayTxns.map((txn: any) => (
                <div key={txn.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#4d212a]">{txn.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className={`font-bold ${txn.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                    {txn.amount > 0 ? "+" : ""}₹{Math.abs(txn.amount)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "earnings" && (
          <>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    period === p ? "bg-white text-[#0b50d5] shadow-sm" : "text-slate-500"
                  }`}
                >
                  {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white">
                <p className="text-xs font-bold opacity-80">Total Earnings</p>
                <p className="text-3xl font-black mt-2">₹{totalWeekEarnings}</p>
                <p className="text-xs opacity-80 mt-1">{period === "week" ? "This Week" : period === "today" ? "Today" : "This Month"}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400">Total Deliveries</p>
                <p className="text-3xl font-black text-slate-800 mt-2">{totalDeliveries}</p>
                <p className="text-xs text-green-500 mt-1">₹{Math.round(totalWeekEarnings / totalDeliveries)}/delivery</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Daily Breakdown</h3>
              <div className="space-y-3">
                {weeklyEarnings.map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-600 w-8">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{day.deliveries} deliveries</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{day.earnings}</p>
                      <p className="text-xs text-slate-400">₹{day.avgPerDelivery}/order</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Earnings Chart</h3>
              <div className="h-40 flex items-end gap-2">
                {weeklyEarnings.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-[#0b50d5] to-blue-400 rounded-t-lg"
                      style={{ height: `${(day.earnings / 1100) * 100}%`, minHeight: "8px" }}
                    />
                    <span className="text-[10px] text-slate-400">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Download Report
            </button>
          </>
        )}

        {activeTab === "payouts" && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Payout History</h3>
              <div className="space-y-3">
                {[
                  { date: "2024-01-15", amount: 1500, status: "completed", method: "Bank Transfer" },
                  { date: "2024-01-10", amount: 2000, status: "completed", method: "Bank Transfer" },
                  { date: "2024-01-05", amount: 800, status: "completed", method: "UPI" },
                ].map((payout, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-800">₹{payout.amount}</p>
                      <p className="text-xs text-slate-500">{payout.date} • {payout.method}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Request Payout</h3>
              <div className="flex gap-3">
                {[500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => requestPayout(amount)}
                    className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:border-[#0b50d5] hover:text-[#0b50d5] transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <RiderNavBar active="wallet" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider", icon: "map" },
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