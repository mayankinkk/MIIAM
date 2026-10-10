"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser } from "@/lib/vendor";
import type { Order } from "@/lib/types";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import logger from "@/lib/logger";

interface VendorWallet {
  balance: number;
  total_earned: number;
  pending_payout: number;
  last_payout: number;
  last_payout_date: string | null;
}

export default function VendorWalletPage() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showRequestPayout) {
        setShowRequestPayout(false);
      }
    };
    if (showRequestPayout) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showRequestPayout]);

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

    const delivered = data?.filter((o: Order) => o.status === "delivered") || [];
    const total = delivered.reduce((s: number, o: Order) => s + o.total_amount, 0);
    const platformFee = total * 0.15; // 15% platform commission
    const netEarnings = total - platformFee;

    // Last 30 days delivered for pending
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDelivered = delivered.filter((o: Order) => new Date(o.placed_at) >= thirtyDaysAgo);
    const pendingAmount = recentDelivered.reduce((s: number, o: Order) => s + o.total_amount, 0);
    const pendingNet = pendingAmount - pendingAmount * 0.15;

    setWallet({
      balance: netEarnings,
      total_earned: total,
      pending_payout: pendingNet,
      last_payout: 0,
      last_payout_date: null,
    });
  }

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    if (amount > wallet.balance) {
      useToastStore.getState().addToast("Insufficient balance", "error");
      return;
    }
    if (
      !(await confirm({
        title: "Request Payout",
        message: "Are you sure you want to request a payout? This action cannot be undone.",
        variant: "danger",
      }))
    )
      return;
    try {
      const { error } = await supabase.from("vendor_payouts").insert({
        vendor_id: vendorId,
        amount,
        status: "pending",
        requested_at: new Date().toISOString(),
      });
      if (error) throw error;
      setWallet({
        ...wallet,
        balance: wallet.balance - amount,
        pending_payout: wallet.pending_payout + amount,
      });
      setShowRequestPayout(false);
      setPayoutAmount("");
      useToastStore.getState().addToast("Payout requested successfully", "success");
    } catch (err) {
      logger.error({ err }, "Failed to request payout");
      useToastStore.getState().addToast("Failed to request payout", "error");
    }
  };

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const recentTransactions = orders
    .filter((o) => ["delivered", "cancelled", "refunded"].includes(o.status))
    .slice(0, 10);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Wallet & Payouts
        </h1>
        <p className="mt-1 text-[var(--color-outline)]">
          Track your earnings and manage withdrawals
        </p>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dim)] p-8 text-white shadow-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">Available Balance</p>
            <p className="mt-2 text-5xl font-black">₹{wallet.balance.toFixed(2)}</p>
          </div>
          <span className="material-symbols-outlined text-5xl text-white/30">
            account_balance_wallet
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-white/80">Total Earned</p>
            <p className="text-xl font-bold">₹{wallet.total_earned.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-white/80">Pending</p>
            <p className="text-xl font-bold">₹{wallet.pending_payout.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-white/80">Last Payout</p>
            <p className="text-xl font-bold">₹{wallet.last_payout.toFixed(0)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowRequestPayout(true)}
          className="mt-6 w-full rounded-2xl bg-[var(--color-surface-container-lowest)] py-4 text-lg font-extrabold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-container-lowest)]/90"
        >
          Request Payout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <span className="material-symbols-outlined text-green-500">trending_up</span>
          <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
            ₹{(wallet.total_earned * 0.85).toFixed(0)}
          </p>
          <p className="text-sm font-medium text-[var(--color-outline)]">
            Net Earnings (after 15% fee)
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <span className="material-symbols-outlined text-accent">receipt_long</span>
          <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
            {deliveredOrders.length}
          </p>
          <p className="text-sm font-medium text-[var(--color-outline)]">Completed Orders</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <span className="material-symbols-outlined text-amber-500">percent</span>
          <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">15%</p>
          <p className="text-sm font-medium text-[var(--color-outline)]">Platform Fee</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <span className="material-symbols-outlined text-accent">payments</span>
          <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
            ₹
            {wallet.total_earned > 0
              ? (wallet.total_earned / deliveredOrders.length).toFixed(0)
              : 0}
          </p>
          <p className="text-sm font-medium text-[var(--color-outline)]">Avg per Order</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="p-6 pb-4">
          <h3 className="font-bold text-[var(--color-on-surface)]">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Recent transactions</caption>
            <thead className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Order
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Date
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Amount
                </th>
                <th className="p-4 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Net (est.)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--color-outline-variant)]">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentTransactions.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    <td className="p-4 text-xs font-bold text-[var(--color-on-surface)]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-xs text-[var(--color-outline)]">
                      {new Date(order.placed_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs font-bold text-[var(--color-on-surface)]">
                      +₹{order.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-xs font-bold text-green-600">
                      {order.status === "delivered"
                        ? `+₹${(order.total_amount * 0.85).toFixed(2)}`
                        : "-"}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRequestPayout(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-modal-title"
        >
          <div
            className="m-4 w-full max-w-md rounded-3xl bg-[var(--color-surface-container-lowest)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="payout-modal-title"
                className="text-xl font-extrabold text-[var(--color-on-surface)]"
              >
                Request Payout
              </h2>
              <button
                onClick={() => setShowRequestPayout(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Available Balance
                </label>
                <p className="text-2xl font-black text-[var(--color-primary)]">
                  ₹{wallet.balance.toFixed(2)}
                </p>
              </div>
              <div>
                <label
                  htmlFor="payout-amount"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Withdrawal Amount (₹)
                </label>
                <input
                  id="payout-amount"
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={wallet.balance}
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-lg font-bold focus:border-[var(--color-primary)] focus:outline-none"
                />
                <div className="mt-2 flex gap-2">
                  {[500, 1000, 2000, 5000]
                    .filter((a) => a <= wallet.balance)
                    .map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setPayoutAmount(amount.toString())}
                        className="rounded-lg bg-[var(--color-surface-container)] px-3 py-1.5 text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      >
                        ₹{amount}
                      </button>
                    ))}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                <p className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Payouts are processed within 3-5 business days to your registered bank account.
                </p>
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={
                  !payoutAmount ||
                  parseFloat(payoutAmount) <= 0 ||
                  parseFloat(payoutAmount) > wallet.balance
                }
                className="text-on-primary w-full rounded-2xl bg-[var(--color-primary)] py-4 font-extrabold transition-colors hover:bg-[var(--color-primary-dim)] disabled:opacity-50"
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
