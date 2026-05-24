"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser } from "@/lib/vendor";
import type { Order } from "@/lib/types";

interface VendorWallet {
  balance: number;
  total_earned: number;
  pending_payout: number;
  last_payout: number;
  last_payout_date: string | null;
}

export default function VendorWalletPage() {
  const supabase = createClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<VendorWallet>({
    balance: 0,
    total_earned: 0,
    pending_payout: 0,
    last_payout: 0,
    last_payout_date: null,
  });
  const [loading, setLoading] = useState(true);
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const id = await getVendorIdForUser();
    if (id) {
      setVendorId(id);
      await loadOrders(id);
    }
    setLoading(false);
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);

    const delivered = data?.filter((o) => o.status === "delivered") || [];
    const total = delivered.reduce((s, o) => s + o.total_amount, 0);
    const platformFee = total * 0.15; // 15% platform commission
    const netEarnings = total - platformFee;

    // Last 30 days delivered for pending
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDelivered = delivered.filter(
      (o) => new Date(o.placed_at) >= thirtyDaysAgo
    );
    const pendingAmount = recentDelivered.reduce((s, o) => s + o.total_amount, 0);
    const pendingNet = pendingAmount - pendingAmount * 0.15;

    setWallet({
      balance: netEarnings * 0.4, // 40% available for withdrawal
      total_earned: total,
      pending_payout: pendingNet,
      last_payout: total * 0.3, // 30% was last payout
      last_payout_date: delivered.length > 0 ? delivered[0].placed_at : null,
    });
  }

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    if (amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }
    // In a real app, you'd create a payout record
    setWallet({
      ...wallet,
      balance: wallet.balance - amount,
      pending_payout: wallet.pending_payout + amount,
    });
    setShowRequestPayout(false);
    setPayoutAmount("");
  };

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const recentTransactions = orders.slice(0, 10);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Wallet & Payouts</h1>
        <p className="text-slate-500 mt-1">Track your earnings and manage withdrawals</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-[#ba001c] to-[#6b0011] text-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/60 text-sm font-medium">Available Balance</p>
            <p className="text-5xl font-black mt-2">₹{wallet.balance.toFixed(2)}</p>
          </div>
          <span className="material-symbols-outlined text-5xl text-white/30">account_balance_wallet</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-white/50 text-xs">Total Earned</p>
            <p className="text-xl font-bold">₹{wallet.total_earned.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Pending</p>
            <p className="text-xl font-bold">₹{wallet.pending_payout.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Last Payout</p>
            <p className="text-xl font-bold">₹{wallet.last_payout.toFixed(0)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowRequestPayout(true)}
          className="w-full mt-6 bg-white text-[#ba001c] py-4 rounded-2xl font-extrabold text-lg hover:bg-white/90 transition-colors"
        >
          Request Payout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-green-500">trending_up</span>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{(wallet.total_earned * 0.85).toFixed(0)}</p>
          <p className="text-sm text-slate-500 font-medium">Net Earnings (after 15% fee)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-blue-500">receipt_long</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{deliveredOrders.length}</p>
          <p className="text-sm text-slate-500 font-medium">Completed Orders</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-amber-500">percent</span>
          <p className="text-2xl font-black text-slate-900 mt-2">15%</p>
          <p className="text-sm text-slate-500 font-medium">Platform Fee</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-purple-500">payments</span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{wallet.total_earned > 0 ? (wallet.total_earned / deliveredOrders.length).toFixed(0) : 0}
          </p>
          <p className="text-sm text-slate-500 font-medium">Avg per Order</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-bold text-slate-800">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-y border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No transactions yet</td>
                </tr>
              ) : (
                recentTransactions.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(order.placed_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-800 text-right">
                      +₹{order.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-xs font-bold text-green-600 text-right">
                      {order.status === "delivered" ? `+₹${(order.total_amount * 0.85).toFixed(2)}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Payout Modal */}
      {showRequestPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRequestPayout(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Request Payout</h2>
              <button onClick={() => setShowRequestPayout(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Available Balance</label>
                <p className="text-2xl font-black text-[#ba001c]">₹{wallet.balance.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={wallet.balance}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] text-lg font-bold"
                />
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].filter((a) => a <= wallet.balance).map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPayoutAmount(amount.toString())}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Payouts are processed within 3-5 business days to your registered bank account.
                </p>
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={!payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > wallet.balance}
                className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl hover:bg-[#a40017] transition-colors disabled:opacity-50"
              >
                Request ₹{parseFloat(payoutAmount || "0").toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
