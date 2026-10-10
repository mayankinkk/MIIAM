"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ListSkeleton } from "@/components/Skeleton";

type RefundStatus = "requested" | "processing" | "approved" | "completed" | "rejected";

interface RefundOrder {
  id: string;
  status: string;
  vendor_id?: string;
  total_amount?: number;
  payment_method?: string;
  cancellation_reason?: string;
  user_id?: string;
  vendor?: { shop_name?: string };
}

export default function OrderRefundPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);
  const [order, setOrder] = useState<RefundOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundStatus, setRefundStatus] = useState<RefundStatus>("requested");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    async function loadOrder() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        const data = orderData;
        if (data && data.vendor_id) {
          const { data: vendorData } = await supabase
            .from("vendors")
            .select("shop_name")
            .eq("id", data.vendor_id)
            .single();
          data.vendor = vendorData;
        }

        if (data) {
          setOrder(data);
          if (data.status === "cancelled" || data.status === "refund_requested") {
            setRefundStatus("processing");
          }
          if (data.status === "refunded") {
            setRefundStatus("completed");
          }
        }
      } catch (err) {
        logger.error({ err }, "Failed to load order");
      }
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      addToast(t.refund.selectReason, "error");
      return;
    }

    setCancelling(true);
    try {
      await supabase
        .from("orders")
        .update({
          status: "refund_requested",
          cancellation_reason: cancelReason,
        })
        .eq("id", id);

      setRefundStatus("processing");
      setShowCancelForm(false);
      setShowRefundSuccess(true);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Failed to cancel order"
      );
      addToast(t.refund.refundFailed, "error");
    } finally {
      setCancelling(false);
    }
  };

  const refundTimeline = [
    {
      status: "requested",
      label: t.refund.cancellationRequested,
      time: t.refund.justNow,
      completed: true,
    },
    {
      status: "processing",
      label: t.refund.refundProcessing,
      time: t.refund.businessDays12,
      completed:
        refundStatus === "processing" ||
        refundStatus === "approved" ||
        refundStatus === "completed",
    },
    {
      status: "approved",
      label: t.refund.refundApproved,
      time: t.refund.within24h,
      completed: refundStatus === "approved" || refundStatus === "completed",
    },
    {
      status: "completed",
      label: t.refund.amountCredited,
      time: t.refund.businessDays25,
      completed: refundStatus === "completed",
    },
  ];

  if (loading) {
    return (
      <div className="bg-surface min-h-screen px-6 pt-24" aria-label="Loading...">
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center p-6">
        <span className="mb-4 text-6xl">🔍</span>
        <h2 className="text-on-surface mb-2 text-xl font-bold">{t.orders.orderNotFound}</h2>
        <Link
          href="/app/orders"
          className="bg-primary text-on-primary mt-4 rounded-xl px-6 py-3 font-bold"
        >
          {t.orders.viewAllOrders}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[var(--color-surface-container-lowest)]/90 px-6 py-4 shadow-sm backdrop-blur-2xl">
        <Link
          href={`/app/orders/${id}`}
          aria-label="Go back"
          className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-accent">arrow_back</span>
        </Link>
        <span className="text-accent text-xl font-extrabold tracking-tighter">MIIAM</span>
        <div className="w-10" />
      </nav>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "My Orders", href: "/app/orders" },
          { label: "Refund" },
        ]}
      />
      <main className="mx-auto max-w-lg px-6 pt-24 pb-12">
        {showRefundSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <span
              className="material-symbols-outlined text-green-600 dark:text-green-400"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div>
              <p className="font-bold text-green-700 dark:text-green-300">
                {t.refund.cancellationSubmitted}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t.refund.refundBeingProcessed}
              </p>
            </div>
          </div>
        )}

        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              ["cancelled", "refund_requested", "refunded"].includes(order.status)
                ? "bg-amber-100"
                : "bg-red-100"
            }`}
          >
            <span
              className={`material-symbols-outlined text-5xl ${
                ["cancelled", "refund_requested", "refunded"].includes(order.status)
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {["cancelled", "refund_requested", "refunded"].includes(order.status)
                ? "inventory_2"
                : "cancel"}
            </span>
          </div>
          <h1 className="text-on-surface mb-2 text-2xl font-extrabold">
            {order.status === "refunded" ? t.refund.titleComplete : t.refund.title}
          </h1>
          <p className="text-on-surface-variant">
            {order.status === "refunded" ? t.refund.refundSuccess : t.refund.orderStillProcessing}
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-on-surface font-bold">{t.refund.orderDetails}</h2>
            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-1 text-xs font-bold text-[var(--color-on-surface-variant)]">
              #{id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 border-b border-[var(--color-border-subtle)] pb-4">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.restaurant}</span>
              <span className="text-on-surface font-bold">
                {order.vendor?.shop_name || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.orderTotal}</span>
              <span className="text-on-surface font-bold">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.paymentMethod}</span>
              <span className="text-on-surface font-bold capitalize">
                {order.payment_method || "Card"}
              </span>
            </div>
          </div>
        </div>

        {order.status !== "refunded" && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary mb-4 w-full rounded-xl py-4 font-bold transition-colors"
          >
            {t.refund.requestCancellation}
          </button>
        )}

        {showCancelForm && (
          <div className="mb-6 rounded-xl bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <h3 className="text-on-surface mb-4 font-bold">{t.refund.whyCancelling}</h3>
            <div className="space-y-3">
              {[
                t.refund.reasonTooLong,
                t.refund.reasonChangedMind,
                t.refund.reasonWrongRestaurant,
                t.refund.reasonBetterDeal,
                t.refund.reasonAccidental,
                t.refund.reasonOther,
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                    cancelReason === reason
                      ? "border-primary bg-surface-container-low"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-subtle)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-accent"
                  />
                  <span className="text-on-surface text-sm">{reason}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowCancelForm(false)}
                className="text-on-surface flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-3 font-bold"
              >
                {t.refund.goBack}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold transition-colors disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.refund.submitting}
                  </>
                ) : (
                  t.refund.submitRequest
                )}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h3 className="text-on-surface mb-4 font-bold">{t.refund.refundStatus}</h3>
          <div className="relative space-y-4">
            <div className="absolute top-4 bottom-4 left-[19px] w-0.5 bg-[var(--color-surface-container)]" />

            {refundTimeline.map((step, index) => (
              <div
                key={step.status}
                className={`relative flex items-start gap-4 ${!step.completed ? "opacity-40" : ""}`}
              >
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                    step.completed
                      ? "bg-primary text-on-primary"
                      : "bg-[var(--color-surface-container)] text-[var(--color-outline-variant)]"
                  }`}
                >
                  {step.completed ? (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h4
                    className={`font-bold ${step.completed ? "text-on-surface" : "text-[var(--color-outline-variant)]"}`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-on-surface-variant text-xs">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accent/10 dark:bg-accent/20 border-accent/30 dark:border-accent/40 mt-6 rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-accent">info</span>
            <div>
              <p className="text-accent dark:text-accent font-bold">{t.refund.refundTimeline}</p>
              <p className="text-accent text-sm">{t.refund.refundTimelineDesc}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            href="/app/orders"
            className="text-on-surface hover:border-primary flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 text-center font-bold transition-colors"
          >
            {t.orders.viewAllOrders}
          </Link>
          <Link
            href="/app/support"
            className="text-on-surface hover:border-primary flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 text-center font-bold transition-colors"
          >
            {t.refund.contactSupport}
          </Link>
        </div>
      </main>
    </div>
  );
}
