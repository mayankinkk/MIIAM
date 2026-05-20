"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  title: string;
  date: string;
  sign: string;
}

export default function WalletPage() {
  const supabase = createClient();
  const [balance, setBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWalletData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance, loyalty_points")
        .eq("id", user.id)
        .single();

      if (profile) {
        setBalance(profile.wallet_balance || 0);
        setPoints(profile.loyalty_points || 0);
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, status, placed_at, delivered_at")
        .eq("user_id", user.id)
        .in("status", ["delivered", "cancelled"])
        .order("placed_at", { ascending: false })
        .limit(20);

      if (orders) {
        const txns: WalletTransaction[] = orders.map(order => {
          const isRefund = order.status === "cancelled";
          return {
            id: order.id,
            amount: order.total_amount,
            type: isRefund ? "refund" : "payment",
            title: isRefund ? `Refund for Order #${order.id.slice(0, 8).toUpperCase()}` : `Order #${order.id.slice(0, 8).toUpperCase()}`,
            date: order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "",
            sign: isRefund ? "+" : "-",
          };
        });
        setTransactions(txns);
      }

      setLoading(false);
    }
    loadWalletData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_10px_30px_rgba(77,33,42,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        </div>
        <span className="text-slate-800 font-bold hidden md:block">Wallet</span>
      </nav>

      <main className="pt-24 max-w-2xl mx-auto px-4">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-[#4e0006] to-[#ba001c] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-[#ba001c]/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col items-start gap-6">
            <div className="w-full flex justify-between items-start">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                <span className="text-xs font-bold tracking-widest uppercase">MIIAM Wallet</span>
              </div>
              <span className="material-symbols-outlined text-3xl opacity-50">contactless</span>
            </div>
            
            <div>
              <p className="text-white/80 font-medium text-sm mb-1">Available Balance</p>
              <h1 className="text-5xl font-extrabold tracking-tighter">₹{balance.toFixed(2)}</h1>
            </div>

            <div className="w-full flex gap-3 mt-2">
              <button className="flex-1 bg-white text-[#ba001c] py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                Add Money
              </button>
              <button className="flex-1 border border-white/30 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">stars</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">MIIAM Points</p>
              <p className="text-2xl font-black text-slate-800">{points}</p>
            </div>
          </div>
          <Link href="/app/referral" className="text-xs font-bold text-[#ba001c]">
            Earn More →
          </Link>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4">Transaction History</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p className="text-sm text-slate-500 mt-2">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.sign === "+" ? "bg-green-100" : "bg-slate-100"}`}>
                      <span className={`material-symbols-outlined text-lg ${txn.sign === "+" ? "text-green-600" : "text-slate-600"}`}>
                        {txn.sign === "+" ? "call_received" : "call_made"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{txn.title}</p>
                      <p className="text-xs text-slate-400">{txn.date}</p>
                    </div>
                  </div>
                  <p className={`font-black text-base ${txn.sign === "+" ? "text-green-600" : "text-slate-800"}`}>
                    {txn.sign}₹{txn.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}