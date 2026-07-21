"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) setBalance(wallet.balance || 0);

      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (txns) setTransactions(txns);
    } catch {
      // Wallet table may not exist yet
    }
    setLoading(false);
  }

  async function redeemGiftCard() {
    if (!giftCode.trim() || redeeming) return;
    setRedeeming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCode.trim(), userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(prev => prev + data.amount);
        setGiftCode("");
        loadWallet();
      }
    } catch {
      // Gift card redemption not available yet
    }
    setRedeeming(false);
  }

  return (
    <PullToRefresh onRefresh={loadWallet}>
      <div className="min-h-screen bg-surface pb-24">
        <header className="bg-surface border-b border-outline-variant/10 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/app/profile" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-xl font-black text-on-surface">Wallet</h1>
          </div>
        </header>

        <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Profile", href: "/app/profile" }, { label: "Wallet" }]} />

        <main className="px-5 py-6 max-w-2xl mx-auto space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dim rounded-3xl p-6 text-white shadow-lg">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Available Balance</p>
            <p className="text-4xl font-black mt-2">₹{balance.toFixed(2)}</p>
            <p className="text-white/60 text-xs mt-2">Use your wallet balance at checkout</p>
          </div>

          {/* Gift Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
            <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">card_giftcard</span>
              Redeem Gift Card
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                placeholder="Enter gift card code"
                className="flex-1 px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 focus:border-primary outline-none text-sm font-mono tracking-wider"
              />
              <button
                onClick={redeemGiftCard}
                disabled={!giftCode.trim() || redeeming}
                className="px-5 py-3 bg-primary text-white font-bold rounded-xl text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                {redeeming ? "..." : "Redeem"}
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h2 className="font-bold text-on-surface mb-3">Transaction History</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-surface-container rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface-container rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">receipt_long</span>
                <p className="text-on-surface-variant mt-2 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => (
                  <div key={txn.id} className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 border border-outline-variant/5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <span className={`material-symbols-outlined text-lg ${
                        txn.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                        {txn.type === "credit" ? "add" : "remove"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-on-surface truncate">{txn.description}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`font-bold text-sm ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                      {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </PullToRefresh>
  );
}
