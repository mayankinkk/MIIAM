"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { redeemGiftCard, getUserGiftCards, type GiftCard } from "@/lib/gift-cards";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

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
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      const cards = await getUserGiftCards(user.id);
      setGiftCards(cards);
    } catch {
      // Wallet table may not exist yet
    }
    setLoading(false);
  }

  async function redeemGiftCardCode() {
    if (!giftCode.trim() || redeeming) return;
    setRedeeming(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Amount of 0 means "redeem full balance into wallet"
      const result = await redeemGiftCard(giftCode.trim(), user.id, 0);
      if (result.success) {
        addToast(`Gift card redeemed! Balance: ₹${result.discount}`, "success");
        setGiftCode("");
        loadWallet();
      } else {
        addToast(result.error || "Failed to redeem gift card", "error");
      }
    } catch (err) {
      logger.error({ err }, "Gift card redemption failed");
      addToast("Failed to redeem gift card", "error");
    }
    setRedeeming(false);
  }

  return (
    <PullToRefresh onRefresh={loadWallet}>
      <div className="bg-surface min-h-screen pb-24">
        <header className="bg-surface border-outline-variant/10 border-b px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/app/profile"
              className="bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-on-surface text-xl font-black">Wallet</h1>
          </div>
        </header>

        <Breadcrumbs
          items={[
            { label: "Home", href: "/app/home" },
            { label: "Profile", href: "/app/profile" },
            { label: "Wallet" },
          ]}
        />

        <main className="mx-auto max-w-2xl space-y-6 px-5 py-6">
          {/* Balance Card */}
          <div className="from-primary to-primary-dim text-on-primary rounded-3xl bg-gradient-to-br p-6 shadow-lg">
            <p className="text-on-primary/70 text-xs font-bold tracking-wider uppercase">
              Available Balance
            </p>
            <p className="mt-2 text-4xl font-black">₹{balance.toFixed(2)}</p>
            <p className="text-on-primary/60 mt-2 text-xs">Use your wallet balance at checkout</p>
          </div>

          {/* Gift Card */}
          <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-5">
            <h2 className="text-on-surface mb-3 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-accent">card_giftcard</span>
              Redeem Gift Card
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                placeholder="Enter gift card code"
                className="bg-surface-container border-outline-variant/20 focus:border-primary flex-1 rounded-xl border px-4 py-3 font-mono text-sm tracking-wider outline-none"
              />
              <button
                onClick={redeemGiftCardCode}
                disabled={!giftCode.trim() || redeeming}
                className="bg-primary text-on-primary rounded-xl px-5 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {redeeming ? "..." : "Redeem"}
              </button>
            </div>
          </div>

          {/* Gift Cards */}
          {giftCards.length > 0 && (
            <div>
              <h2 className="text-on-surface mb-3 font-bold">Your Gift Cards</h2>
              <div className="space-y-2">
                {giftCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-surface-container-lowest border-outline-variant/5 flex items-center gap-3 rounded-xl border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <span className="material-symbols-outlined text-amber-600">
                        card_giftcard
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface font-mono text-sm font-bold tracking-wider">
                        {card.code}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {card.status === "active" ? `Balance ₹${card.balance}` : card.status}
                        {card.expires_at && new Date(card.expires_at) < new Date()
                          ? " (expired)"
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        card.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          <div>
            <h2 className="text-on-surface mb-3 font-bold">Transaction History</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-container-lowest animate-pulse rounded-xl p-4">
                    <div className="bg-surface-container mb-2 h-4 w-3/4 rounded" />
                    <div className="bg-surface-container h-3 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">
                  receipt_long
                </span>
                <p className="text-on-surface-variant mt-2 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-surface-container-lowest border-outline-variant/5 flex items-center gap-3 rounded-xl border p-4"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg ${
                          txn.type === "credit" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {txn.type === "credit" ? "add" : "remove"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-on-surface truncate text-sm font-bold">
                        {txn.description}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {new Date(txn.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}
                    >
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
