"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
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
  vendor?: { name?: string; shop_name?: string };
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        const data = orderData;
        if (data && data.vendor_id) {
          const { data: vendorData } = await supabase.from("vendors").select("shop_name").eq("id", data.vendor_id).single();
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
        console.error("Failed to load order:", err);
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
      console.error("Failed to cancel order:", error);
      addToast(t.refund.refundFailed, "error");
    } finally {
      setCancelling(false);
    }
  };

  const refundTimeline = [
    { status: "requested", label: t.refund.cancellationRequested, time: t.refund.justNow, completed: true },
    { status: "processing", label: t.refund.refundProcessing, time: t.refund.businessDays12, completed: refundStatus === "processing" || refundStatus === "approved" || refundStatus === "completed" },
    { status: "approved", label: t.refund.refundApproved, time: t.refund.within24h, completed: refundStatus === "approved" || refundStatus === "completed" },
    { status: "completed", label: t.refund.amountCredited, time: t.refund.businessDays25, completed: refundStatus === "completed" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface px-6 pt-24" aria-label="Loading...">
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">{t.orders.orderNotFound}</h2>
        <Link href="/app/orders" className="bg-primary text-white px-6 py-3 rounded-xl font-bold mt-4">
          {t.orders.viewAllOrders}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-2xl shadow-sm">
        <Link href={`/app/orders/${id}`} aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        <div className="w-10" />
      </nav>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders', href: '/app/orders' }, { label: 'Refund' }]} />
      <main className="pt-24 pb-12 px-6 max-w-lg mx-auto">
        {showRefundSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <div>
              <p className="font-bold text-green-700">{t.refund.cancellationSubmitted}</p>
              <p className="text-sm text-green-600">{t.refund.refundBeingProcessed}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            ["cancelled", "refund_requested", "refunded"].includes(order.status) 
              ? "bg-amber-100" 
              : "bg-red-100"
          }`}>
            <span className={`material-symbols-outlined text-5xl ${
              ["cancelled", "refund_requested", "refunded"].includes(order.status) 
                ? "text-amber-500" 
                : "text-red-500"
            }`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {["cancelled", "refund_requested", "refunded"].includes(order.status) 
                ? "inventory_2" 
                : "cancel"
              }
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface mb-2">
            {order.status === "refunded" ? t.refund.titleComplete : t.refund.title}
          </h1>
          <p className="text-on-surface-variant">
            {order.status === "refunded" 
              ? t.refund.refundSuccess
              : t.refund.orderStillProcessing
            }
          </p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-on-surface">{t.refund.orderDetails}</h2>
            <span className="text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2 py-1 rounded-full font-bold">
              #{id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-3 pb-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.restaurant}</span>
              <span className="font-bold text-on-surface">{order.vendor?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.orderTotal}</span>
              <span className="font-bold text-primary">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">{t.refund.paymentMethod}</span>
              <span className="font-bold text-on-surface capitalize">{order.payment_method || "Card"}</span>
            </div>
          </div>
        </div>

        {order.status !== "refunded" && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dim transition-colors mb-4"
          >
            {t.refund.requestCancellation}
          </button>
        )}

        {showCancelForm && (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-on-surface mb-4">{t.refund.whyCancelling}</h3>
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
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
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
                    className="text-primary"
                  />
                  <span className="text-sm text-on-surface">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelForm(false)}
                className="flex-1 py-3 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-on-surface"
              >
                {t.refund.goBack}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.refund.submitting}
                  </>
                ) : t.refund.submitRequest}
              </button>
            </div>
          </div>
        )}

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-on-surface mb-4">{t.refund.refundStatus}</h3>
          <div className="space-y-4 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[var(--color-surface-container)]" />
            
            {refundTimeline.map((step, index) => (
              <div key={step.status} className={`relative flex items-start gap-4 ${!step.completed ? "opacity-40" : ""}`}>
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? "bg-primary text-white" 
                    : "bg-[var(--color-surface-container)] text-[var(--color-outline-variant)]"
                }`}>
                  {step.completed ? (
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h4 className={`font-bold ${step.completed ? "text-on-surface" : "text-[var(--color-outline-variant)]"}`}>
                    {step.label}
                  </h4>
                  <p className="text-xs text-on-surface-variant">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <p className="font-bold text-blue-700">{t.refund.refundTimeline}</p>
              <p className="text-sm text-blue-600">
                {t.refund.refundTimelineDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link 
            href="/app/orders"
            className="flex-1 text-center py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-on-surface hover:border-primary transition-colors"
          >
            {t.orders.viewAllOrders}
          </Link>
          <Link 
            href="/app/support"
            className="flex-1 text-center py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-on-surface hover:border-primary transition-colors"
          >
            {t.refund.contactSupport}
          </Link>
        </div>
      </main>
    </div>
  );
}