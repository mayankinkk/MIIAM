"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";

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
  const supabase = useMemo(() => createClient(), []);
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
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [payoutHistory, setPayoutHistory] = useState<{ date: string; amount: number; status: string; method: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ account_number: "", ifsc_code: "", bank_name: "", account_holder: "" });

  async function loadWalletData() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: riderData } = await supabase.from("riders").select("id").eq("user_id", user.id).maybeSingle();
      if (!riderData) { setLoading(false); return; }
      setRiderId(riderData.id);

      // Load wallet balance
      const { data: wallet } = await supabase.from("rider_wallets").select("*").eq("rider_id", riderData.id).maybeSingle();
      if (wallet) {
        setWalletData({
          balance: Number(wallet.balance) || 0,
          pendingPayout: Number(wallet.pending_payout) || 0,
          totalEarnings: Number(wallet.total_earnings) || 0,
          advanceUsed: Number(wallet.advance_used) || 0,
          instantPayoutFee: 2,
        });
      } else {
        // Create wallet if not exists
        const { data: newWallet } = await supabase.from("rider_wallets").insert({
          rider_id: riderData.id,
          balance: 0,
          pending_payout: 0,
          total_earnings: 0,
          advance_used: 0,
        }).select().single();
        if (newWallet) {
          setWalletData({
            balance: 0, pendingPayout: 0, totalEarnings: 0, advanceUsed: 0, instantPayoutFee: 2,
          });
        }
      }

      // Load transaction history
      const { data: txns } = await supabase
        .from("rider_wallet")
        .select("*")
        .eq("rider_id", riderData.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (txns) {
        setTransactions(txns.map((t: { id: string; amount: number | string; type: string; description: string | null; created_at: string; order_id: string | null }) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type as Transaction["type"],
          description: t.description || "",
          created_at: t.created_at,
          order_id: t.order_id,
        })));
      }

      // Load weekly earnings from delivered orders
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekOrders } = await supabase
        .from("orders")
        .select("rider_earning, placed_at")
        .eq("rider_id", riderData.id)
        .in("status", ["delivered", "completed"])
        .gte("placed_at", weekStart.toISOString());

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyMap: Record<string, { deliveries: number; earnings: number }> = {};
      dayNames.forEach(d => { dailyMap[d] = { deliveries: 0, earnings: 0 }; });

      let weekTotalEarnings = 0;
      let weekTotalDeliveries = 0;

      (weekOrders || []).forEach((order: { placed_at: string; rider_earning: number | null }) => {
        const date = new Date(order.placed_at);
        const dayKey = dayNames[date.getDay()];
        if (dailyMap[dayKey]) {
          dailyMap[dayKey].deliveries += 1;
          const earning = Number(order.rider_earning) || 0;
          dailyMap[dayKey].earnings += earning;
          weekTotalEarnings += earning;
          weekTotalDeliveries += 1;
        }
      });

      setWeeklyEarnings(dayNames.map(day => ({
        date: day,
        deliveries: dailyMap[day].deliveries,
        earnings: dailyMap[day].earnings,
        avgPerDelivery: dailyMap[day].deliveries > 0
          ? Math.round((dailyMap[day].earnings / dailyMap[day].deliveries) * 10) / 10
          : 0,
      })));
      setTotalWeekEarnings(weekTotalEarnings);
      setTotalDeliveries(weekTotalDeliveries);

      // Load today's earnings
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("rider_earning")
        .eq("rider_id", riderData.id)
        .in("status", ["delivered", "completed"])
        .gte("placed_at", todayStart.toISOString());
      const todayEarn = (todayOrders || []).reduce((s: number, o: { rider_earning: number | null }) => s + (Number(o.rider_earning) || 0), 0);
      setTodayEarnings(todayEarn);
      setTodayDeliveries(todayOrders?.length || 0);

      // Load payout history from rider_wallet transactions
      const { data: payoutTxns } = await supabase
        .from("rider_wallet")
        .select("amount, created_at, description")
        .eq("rider_id", riderData.id)
        .in("type", ["payout", "instant_payout"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (payoutTxns) {
        setPayoutHistory(payoutTxns.map((t: { created_at: string; amount: number | string; description: string | null }) => ({
          date: new Date(t.created_at).toLocaleDateString("en-IN"),
          amount: Number(t.amount),
          status: "completed",
          method: t.description?.includes("Instant") ? "Instant UPI" : "Bank Transfer",
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWalletData();
  }, []);

  async function requestPayout(amount: number) {
    if (!riderId) return;
    try {
      await supabase.from("rider_wallets").update({ pending_payout: amount }).eq("rider_id", riderId);
      await supabase.from("rider_wallet").insert({
        rider_id: riderId,
        amount: -amount,
        type: "payout",
        description: `Payout request for ₹${amount}`,
      });
      await loadWalletData();
      useToastStore.getState().addToast(`Payout request of ₹${amount} submitted!`, "success");
    } catch (err) {
      useToastStore.getState().addToast("Failed to submit payout request. Please try again.", "error");
    }
  }

  async function instantPayout() {
    const amount = parseInt(instantPayoutAmount);
    if (isNaN(amount) || amount < 100) {
      useToastStore.getState().addToast("Minimum instant payout is ₹100", "error");
      return;
    }
    if (amount > walletData.balance) {
      useToastStore.getState().addToast("Insufficient balance", "error");
      return;
    }

    setProcessingPayout(true);
    try {
      const fee = Math.round(amount * (walletData.instantPayoutFee / 100));
      const netAmount = amount - fee;

      if (riderId) {
        await supabase.from("rider_wallets").update({
          balance: walletData.balance - amount,
          pending_payout: walletData.pendingPayout + netAmount,
        }).eq("rider_id", riderId);
        await supabase.from("rider_wallet").insert({
          rider_id: riderId,
          amount: -amount,
          type: "instant_payout",
          description: `Instant payout - ₹${netAmount} credited (₹${fee} fee)`,
        });
        await loadWalletData();
      }

      setShowInstantPayout(false);
      setInstantPayoutAmount("");
      useToastStore.getState().addToast(`Instant payout of ₹${netAmount} initiated!`, "success");
    } catch (err) {
      useToastStore.getState().addToast("Failed to process instant payout. Please try again.", "error");
    } finally {
      setProcessingPayout(false);
    }
  }

  const now = Date.now();
  const displayTxns: Transaction[] = transactions;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">wifi_off</span>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Something went wrong</h2>
          <p className="text-[var(--color-outline)] mb-6">{error}</p>
          <button
            onClick={() => loadWalletData()}
            className="px-6 py-3 bg-brand-secondary text-white rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[var(--color-outline)] font-medium">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={loadWalletData}>
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-gradient-to-br from-brand-secondary to-[#0044bf] text-white p-6 pb-12 rounded-b-[3rem]">
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
                className="flex-1 bg-yellow-400 text-brand-secondary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">bolt</span>
                Instant Payout
              </button>
              <button 
                onClick={() => requestPayout(500)}
                className="flex-1 bg-[var(--color-surface-container-lowest)] text-brand-secondary py-3 rounded-xl font-bold"
              >
                Weekly Payout
              </button>
            </div>
          </>
        )}
      </header>

      <main className="px-6 -mt-6 space-y-6 pb-32">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-1 flex">
          {(["wallet", "earnings", "payouts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-brand-secondary text-white"
                  : "text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "wallet" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-[var(--color-outline-variant)] uppercase">Total Earned</p>
                <p className="text-lg font-black text-green-600">₹{walletData.totalEarnings}</p>
              </div>
              <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-[var(--color-outline-variant)] uppercase">Advance Used</p>
                <p className="text-lg font-black text-amber-600">₹{walletData.advanceUsed}</p>
              </div>
              <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-2xl shadow-lg text-center">
                <p className="text-[9px] text-[var(--color-outline-variant)] uppercase">Pending</p>
                <p className="text-lg font-black text-[var(--color-outline-variant)]">₹{walletData.pendingPayout}</p>
              </div>
            </div>

            {/* Quick Stats - Real data from orders */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-green-800">Today's Performance</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-black text-green-600">₹{todayEarnings}</p>
                  <p className="text-[9px] text-[var(--color-outline)]">Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600">{todayDeliveries}</p>
                  <p className="text-[9px] text-[var(--color-outline)]">Deliveries</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">₹{todayDeliveries > 0 ? Math.round(todayEarnings / todayDeliveries * 10) / 10 : 0}</p>
                  <p className="text-[9px] text-[var(--color-outline)]">Avg/Order</p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Recent Transactions</h2>
            
            <div className="space-y-3">
              {displayTxns.map((txn) => (
                <div key={txn.id} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl shadow-sm flex justify-between items-center">
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
                      <p className="font-medium text-[var(--color-on-surface)]">{txn.description}</p>
                      <p className="text-xs text-[var(--color-outline-variant)]">
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
            <div className="flex gap-2 bg-[var(--color-surface-container)] p-1 rounded-xl">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    period === p ? "bg-[var(--color-surface-container-lowest)] text-brand-secondary shadow-sm" : "text-[var(--color-outline)]"
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
              <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
                <p className="text-xs font-bold text-[var(--color-outline-variant)]">Total Deliveries</p>
                <p className="text-3xl font-black text-[var(--color-on-surface)] mt-2">{totalDeliveries}</p>
                <p className="text-xs text-green-500 mt-1">{totalDeliveries > 0 ? `₹${Math.round(totalWeekEarnings / totalDeliveries)}/delivery` : "No deliveries yet"}</p>
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

            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Daily Breakdown</h3>
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
                  <div key={day.date} className="flex items-center justify-between p-2 hover:bg-[var(--color-surface-subtle)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--color-on-surface-variant)] w-8">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-outline-variant)]">{day.deliveries} deliveries</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{day.earnings}</p>
                      <p className="text-xs text-[var(--color-outline-variant)]">₹{day.avgPerDelivery}/order</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Earnings Chart</h3>
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
                      className="w-full bg-gradient-to-t from-brand-secondary to-blue-400 rounded-t-lg"
                      style={{ height: `${(day.earnings / 1100) * 100}%`, minHeight: "8px" }}
                    />
                    <span className="text-[10px] text-[var(--color-outline-variant)]">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const rows = [["Date", "Earnings"]];
                const chartBars = document.querySelectorAll('[class*="bg-gradient-to-t"]');
                rows.push(["Total", "See chart above"]);
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "earnings-report.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full py-4 bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-border-subtle)] rounded-2xl font-bold text-[var(--color-on-surface-variant)] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">download</span>
              Download Report
            </button>
          </>
        )}

        {activeTab === "payouts" && (
          <>
              <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Bank Details</h3>
              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">account_balance</span>
                  </div>
                  <div>
                    <p className="font-bold">Primary Account</p>
                    <p className="text-xs text-[var(--color-outline)]">Primary Account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBankModal(true)}
                  className="text-brand-secondary text-sm font-bold"
                >
                  Edit
                </button>
              </div>
              <button
                onClick={() => setShowBankModal(true)}
                className="w-full mt-3 py-3 border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl text-[var(--color-outline)] font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add New Bank Account
              </button>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Payout History</h3>
              <div className="space-y-3">
                {payoutHistory.length > 0 ? payoutHistory.map((payout, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[var(--color-surface-subtle)] rounded-xl">
                    <div>
                      <p className="font-bold text-[var(--color-on-surface)]">₹{payout.amount}</p>
                      <p className="text-xs text-[var(--color-outline)]">{payout.date} • {payout.method}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      payout.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {payout.status === "completed" ? "Completed" : "Instant"}
                    </span>
                  </div>
                )) : (
                  <p className="text-center text-[var(--color-outline-variant)] text-sm py-4">No payout history yet</p>
                )}
              </div>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Request Payout</h3>
              <div className="flex gap-3 mb-4">
                {[500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => requestPayout(amount)}
                    className="flex-1 py-3 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-[var(--color-on-surface-variant)] hover:border-brand-secondary hover:text-brand-secondary transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => requestPayout(walletData.balance)}
                className="w-full py-4 bg-brand-secondary text-white rounded-xl font-bold"
              >
                Withdraw Full Balance (₹{walletData.balance})
              </button>
              <p className="text-xs text-[var(--color-outline-variant)] text-center mt-2">Standard payout: 24-48 hours • Free</p>
            </div>
          </>
        )}
      </main>

      {/* Instant Payout Modal */}
      {showInstantPayout && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Instant Payout</h3>
              <button onClick={() => setShowInstantPayout(false)} aria-label="Close">
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
              <label className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-2 block">Enter Amount</label>
              <input 
                type="number"
                value={instantPayoutAmount}
                onChange={(e) => setInstantPayoutAmount(e.target.value)}
                placeholder="Min: ₹100"
                className="w-full border-2 border-[var(--color-border-subtle)] rounded-xl p-4 text-xl font-bold focus:outline-none focus:border-brand-secondary"
              />
            </div>

            {instantPayoutAmount && parseInt(instantPayoutAmount) >= 100 && (
              <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-outline)]">Amount</span>
                  <span className="font-bold">₹{instantPayoutAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-outline)]">Fee (2%)</span>
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
              className="w-full py-4 bg-yellow-400 text-brand-secondary font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
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

    </div>
    </PullToRefresh>

    {/* Bank Account Modal */}
    {showBankModal && (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-md p-6">
          <h3 className="font-bold text-lg mb-4">Bank Account Details</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Account Holder Name"
              value={bankForm.account_holder}
              onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
              className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={bankForm.account_number}
              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
              className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="text"
              placeholder="IFSC Code"
              value={bankForm.ifsc_code}
              onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
              className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="text"
              placeholder="Bank Name"
              value={bankForm.bank_name}
              onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
              className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowBankModal(false)}
              className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!bankForm.account_number || !bankForm.ifsc_code || !bankForm.account_holder) {
                  import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Please fill all required fields", "error"));
                  return;
                }
                if (riderId) {
                  await supabase.from("rider_wallets").update({
                    bank_account_number: bankForm.account_number,
                    bank_ifsc: bankForm.ifsc_code,
                    bank_name: bankForm.bank_name,
                    bank_holder_name: bankForm.account_holder,
                  }).eq("rider_id", riderId);
                }
                import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Bank details saved!", "success"));
                setShowBankModal(false);
                setBankForm({ account_number: "", ifsc_code: "", bank_name: "", account_holder: "" });
              }}
              className="flex-1 py-3 bg-brand-secondary text-white rounded-xl font-bold text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}