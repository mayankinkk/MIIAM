"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  type: "advance" | "expense" | "payout" | "earning" | "instant_payout";
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
  const [riderId, setRiderId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "earnings" | "payouts">("wallet");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [showInstantPayout, setShowInstantPayout] = useState(false);
  const [instantPayoutAmount, setInstantPayoutAmount] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [walletData, setWalletData] = useState({ balance: 0, pendingPayout: 0, totalEarnings: 0, advanceUsed: 0, instantPayoutFee: 2 });
  const [weeklyEarnings, setWeeklyEarnings] = useState<DailyEarning[]>([]);
  const [totalWeekEarnings, setTotalWeekEarnings] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  useEffect(() => {
    loadWalletData();
  }, [supabase]);

  async function requestPayout(amount: number) {
    if (riderId) {
      await supabase.from("rider_wallets").update({ pending_payout: amount }).eq("rider_id", riderId);
    }
    alert(`Payout request of ₹${amount} submitted! Will be processed in 24-48 hours.`);
  }

  async function instantPayout() {
    const amount = parseInt(instantPayoutAmount);
    if (amount < 100) {
      alert("Minimum instant payout is ₹100");
      return;
    }
    if (amount > walletData.balance) {
      alert("Insufficient balance");
      return;
    }

    setProcessingPayout(true);
    const fee = Math.round(amount * (walletData.instantPayoutFee / 100));
    const netAmount = amount - fee;

    if (riderId) {
      await supabase.from("rider_wallets").update({
        balance: walletData.balance - amount,
        pending_payout: walletData.pendingPayout + netAmount,
      }).eq("rider_id", riderId);
      await loadWalletData();
    }

    setProcessingPayout(false);
    setShowInstantPayout(false);
    setInstantPayoutAmount("");
    alert(`Instant payout of ₹${netAmount} initiated! (₹${fee} fee deducted). Amount will be credited in 5-30 minutes.`);
  }

  const now = Date.now();
  const displayTxns: Transaction[] = transactions;

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-[#0b50d5] to-[#0044bf] text-white p-6 pb-12 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>

        {activeTab === "wallet" && (
          <>
            <div className="mt-8 text-center">
              <p className="text-sm opacity-70 mb-1">Available Balance</p>
              <p className="text-5xl font-black">₹{walletData.balance.toLocaleString()}</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowInstantPayout(true)}
                className="flex-1 bg-yellow-400 text-[#0b50d5] py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">bolt</span>
                Instant Payout
              </button>
              <button 
                onClick={() => requestPayout(500)}
                className="flex-1 bg-white text-[#0b50d5] py-3 rounded-xl font-bold"
              >
                Weekly Payout
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
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-slate-400 uppercase">Total Earned</p>
                <p className="text-lg font-black text-green-600">₹{walletData.totalEarnings}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-slate-400 uppercase">Advance Used</p>
                <p className="text-lg font-black text-amber-600">₹{walletData.advanceUsed}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-slate-400 uppercase">Pending</p>
                <p className="text-lg font-black text-slate-400">₹{walletData.pendingPayout}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-green-800">Today's Performance</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+12% vs yesterday</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-black text-green-600">₹340</p>
                  <p className="text-[9px] text-slate-500">Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600">8</p>
                  <p className="text-[9px] text-slate-500">Deliveries</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">₹42.5</p>
                  <p className="text-[9px] text-slate-500">Avg/Order</p>
                </div>
              </div>
            </div>

            {/* Referral Program */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600">group_add</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-purple-800">Refer Friends & Earn</p>
                  <p className="text-xs text-purple-600">₹500 for each friend who joins</p>
                </div>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold">
                  Refer Now
                </button>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[#4d212a]">Recent Transactions</h2>
            
            <div className="space-y-3">
              {displayTxns.map((txn) => (
                <div key={txn.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type === "earning" ? "bg-green-100" : 
                      txn.type === "expense" ? "bg-red-100" :
                      txn.type === "instant_payout" ? "bg-yellow-100" : "bg-blue-100"
                    }`}>
                      <span className={`material-symbols-outlined ${
                        txn.type === "earning" ? "text-green-600" : 
                        txn.type === "expense" ? "text-red-600" :
                        txn.type === "instant_payout" ? "text-yellow-600" : "text-blue-600"
                      }`}>
                        {txn.type === "earning" ? "trending_up" : 
                         txn.type === "expense" ? "shopping_cart" :
                         txn.type === "instant_payout" ? "bolt" : "account_balance"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#4d212a]">{txn.description}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                    </div>
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

            {/* Incentive Info */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-600">celebration</span>
                <p className="font-bold text-amber-800">Active Incentives</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Morning Rush (6-10 AM)</span>
                  <span className="font-bold text-amber-800">+₹10/order</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Complete 15 orders/week</span>
                  <span className="font-bold text-amber-800">+₹500 bonus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Peak Hours (12-2 PM, 7-9 PM)</span>
                  <span className="font-bold text-amber-800">1.5x fare</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Daily Breakdown</h3>
              <div className="space-y-3">
                {(weeklyEarnings.length > 0 ? weeklyEarnings : [
                  { date: "Mon", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Tue", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Wed", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Thu", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Fri", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Sat", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Sun", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                ]).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
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
                {(weeklyEarnings.length > 0 ? weeklyEarnings : [
                  { date: "Mon", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Tue", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Wed", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Thu", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Fri", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Sat", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                  { date: "Sun", deliveries: 0, earnings: 0, avgPerDelivery: 0 },
                ]).map((day) => (
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

            <button onClick={() => alert("Report downloaded!")} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Download Report
            </button>
          </>
        )}

        {activeTab === "payouts" && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Bank Details</h3>
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">account_balance</span>
                  </div>
                  <div>
                    <p className="font-bold">HDFC Bank ****4521</p>
                    <p className="text-xs text-slate-500">Primary Account</p>
                  </div>
                </div>
                <button className="text-[#0b50d5] text-sm font-bold">Edit</button>
              </div>
              <button className="w-full mt-3 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add</span>
                Add New Bank Account
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Payout History</h3>
              <div className="space-y-3">
                {[
                  { date: "2024-01-15", amount: 1500, status: "completed", method: "Bank Transfer" },
                  { date: "2024-01-10", amount: 2000, status: "completed", method: "Instant UPI" },
                  { date: "2024-01-05", amount: 800, status: "completed", method: "Bank Transfer" },
                  { date: "2024-01-03", amount: 500, status: "instant", method: "Instant UPI" },
                ].map((payout, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-800">₹{payout.amount}</p>
                      <p className="text-xs text-slate-500">{payout.date} • {payout.method}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      payout.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {payout.status === "completed" ? "Completed" : "Instant"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Request Payout</h3>
              <div className="flex gap-3 mb-4">
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
              <button 
                onClick={() => requestPayout(walletData.balance)}
                className="w-full py-4 bg-[#0b50d5] text-white rounded-xl font-bold"
              >
                Withdraw Full Balance (₹{walletData.balance})
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">Standard payout: 24-48 hours • Free</p>
            </div>
          </>
        )}
      </main>

      {/* Instant Payout Modal */}
      {showInstantPayout && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Instant Payout</h3>
              <button onClick={() => setShowInstantPayout(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-yellow-600">bolt</span>
                <span className="font-bold text-yellow-800">Get money in 5-30 minutes</span>
              </div>
              <p className="text-xs text-yellow-700">2% fee applies for instant transfers</p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-bold text-slate-600 mb-2 block">Enter Amount</label>
              <input 
                type="number"
                value={instantPayoutAmount}
                onChange={(e) => setInstantPayoutAmount(e.target.value)}
                placeholder="Min: ₹100"
                className="w-full border-2 border-slate-200 rounded-xl p-4 text-xl font-bold focus:outline-none focus:border-[#0b50d5]"
              />
            </div>

            {instantPayoutAmount && parseInt(instantPayoutAmount) >= 100 && (
              <div className="bg-slate-50 p-3 rounded-xl mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold">₹{instantPayoutAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee (2%)</span>
                  <span className="font-bold text-red-500">-₹{Math.round(parseInt(instantPayoutAmount) * 0.02)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="font-bold">You receive</span>
                  <span className="font-black text-green-600">₹{parseInt(instantPayoutAmount) - Math.round(parseInt(instantPayoutAmount) * 0.02)}</span>
                </div>
              </div>
            )}

            <button 
              onClick={instantPayout}
              disabled={processingPayout || !instantPayoutAmount || parseInt(instantPayoutAmount) < 100}
              className="w-full py-4 bg-yellow-400 text-[#0b50d5] font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processingPayout ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">bolt</span>
                  Instant Payout Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <RiderNavBar active="wallet" />
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