"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  title: string;
  date: string;
  sign: string;
}

export default function WalletPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    loadWalletData();
  }, []);

  async function loadWalletData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .single();

      if (profile) setBalance(profile.wallet_balance || 0);

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
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    }
    setLoading(false);
  }

  return (
    <PullToRefresh onRefresh={loadWalletData}>
    <div className="min-h-screen bg-surface pb-24">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-bold hidden md:block">Wallet</span>
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Profile', href: '/app/profile' }, { label: 'Wallet' }]} />

      <main className="pt-24 max-w-2xl mx-auto px-4">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-on-primary to-primary rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl shadow-primary/30">
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
              <p className="text-white/80 font-medium text-sm mb-1">{t.cart.totalBalance}</p>
              <h1 className="text-5xl font-extrabold tracking-tighter">₹{balance.toFixed(2)}</h1>
            </div>

            <div className="w-full flex gap-3 mt-2">
              <button
                onClick={() => setShowAddMoney(true)}
                className="flex-1 bg-white text-primary py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Add Money
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex-1 border border-white/30 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-black text-on-surface mb-4">{t.orders.title}</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p className="text-sm text-on-surface-variant mt-2">{t.home.noNotifications}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.sign === "+" ? "bg-green-100" : "bg-surface-container-high"}`}>
                      <span className={`material-symbols-outlined text-lg ${txn.sign === "+" ? "text-green-600" : "text-on-surface-variant"}`}>
                        {txn.sign === "+" ? "call_received" : "call_made"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{txn.title}</p>
                      <p className="text-xs text-slate-400">{txn.date}</p>
                    </div>
                  </div>
                  <p className={`font-black text-base ${txn.sign === "+" ? "text-green-600" : "text-on-surface"}`}>
                    {txn.sign}₹{txn.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

    {/* Add Money Modal */}
    {showAddMoney && (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
          <h3 className="font-bold text-lg mb-4">Add Money to Wallet</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button key={amt} onClick={() => setAddAmount(String(amt))} className="flex-1 py-2 border border-slate-200 rounded-lg font-bold text-sm hover:border-primary">
                  ₹{amt}
                </button>
              ))}
            </div>
            <input type="number" placeholder="Enter amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowAddMoney(false); setAddAmount(""); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm">Cancel</button>
            <button
              onClick={() => {
                const amt = Number(addAmount);
                if (amt <= 0) { import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Enter a valid amount", "error")); return; }
                // Use Razorpay to add money
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = async () => {
                  const res = await fetch("/api/payment/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amt, receipt: `wallet_${Date.now()}` }) });
                  const data = await res.json();
                  if (!res.ok) { import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(data.error || "Failed", "error")); return; }
                  const rzp = new (window as any).Razorpay({
                    key: data.keyId, amount: data.amount, currency: data.currency, name: "MIIAM Wallet",
                    description: "Add Money to Wallet", order_id: data.orderId,
                    handler: async (response: any) => {
                      await supabase.rpc("increment_wallet_balance", { p_user_id: (await supabase.auth.getUser()).data.user?.id, p_amount: amt });
                      setBalance(prev => prev + amt);
                      import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`₹${amt} added to wallet!`, "success"));
                      setShowAddMoney(false); setAddAmount("");
                    },
                    theme: { color: "#ba001c" },
                  });
                  rzp.open();
                };
                document.body.appendChild(script);
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              Add Money
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Withdraw Modal */}
    {showWithdraw && (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
          <h3 className="font-bold text-lg mb-4">Withdraw to Bank</h3>
          <p className="text-sm text-slate-500 mb-4">Available: <span className="font-bold text-primary">₹{balance.toFixed(2)}</span></p>
          <div className="space-y-3">
            {[100, 200, 500].filter(a => a <= balance).map((amt) => (
              <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className="w-full py-3 border border-slate-200 rounded-xl font-bold text-sm hover:border-primary text-left px-4">
                ₹{amt}
              </button>
            ))}
            <input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} max={balance} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(""); }} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm">Cancel</button>
            <button
              onClick={async () => {
                const amt = Number(withdrawAmount);
                if (amt <= 0 || amt > balance) { import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Invalid amount", "error")); return; }
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("wallet_transactions").insert({ user_id: user.id, amount: amt, type: "withdrawal", status: "pending" });
                  await supabase.rpc("decrement_wallet_balance", { p_user_id: user.id, p_amount: amt });
                  setBalance(prev => prev - amt);
                  import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`₹${amt} withdrawal initiated. Processing in 24-48 hours.`, "success"));
                }
                setShowWithdraw(false); setWithdrawAmount("");
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
    </PullToRefresh>
  );
}