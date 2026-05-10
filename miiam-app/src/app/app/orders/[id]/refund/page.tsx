"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RefundStatus = "requested" | "processing" | "approved" | "completed" | "rejected";

export default function OrderRefundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refundStatus, setRefundStatus] = useState<RefundStatus>("requested");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      setLoading(false);
    }
    loadOrder();
  }, [id, supabase]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert("Please select a reason for cancellation");
      return;
    }

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
    }
  };

  const refundTimeline = [
    { status: "requested", label: "Cancellation Requested", time: "Just now", completed: true },
    { status: "processing", label: "Refund Processing", time: "1-2 business days", completed: refundStatus === "processing" || refundStatus === "approved" || refundStatus === "completed" },
    { status: "approved", label: "Refund Approved", time: "Within 24 hours", completed: refundStatus === "approved" || refundStatus === "completed" },
    { status: "completed", label: "Amount Credited", time: "2-5 business days", completed: refundStatus === "completed" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center p-6">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-xl font-bold text-[#4d212a] mb-2">Order not found</h2>
        <Link href="/app/orders" className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold mt-4">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-2xl shadow-sm">
        <Link href={`/app/orders/${id}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
          <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        <div className="w-10" />
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-lg mx-auto">
        {showRefundSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <div>
              <p className="font-bold text-green-700">Cancellation Request Submitted</p>
              <p className="text-sm text-green-600">Your refund is being processed</p>
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
          <h1 className="text-2xl font-extrabold text-[#4d212a] mb-2">
            {order.status === "refunded" ? "Refund Complete" : "Request Cancellation & Refund"}
          </h1>
          <p className="text-[#814c55]">
            {order.status === "refunded" 
              ? "Your refund has been processed successfully"
              : "Your order is still being processed"
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#4d212a]">Order Details</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">
              #{id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex justify-between">
              <span className="text-[#814c55]">Restaurant</span>
              <span className="font-bold text-[#4d212a]">{order.vendor?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#814c55]">Order Total</span>
              <span className="font-bold text-[#ba001c]">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#814c55]">Payment Method</span>
              <span className="font-bold text-[#4d212a] capitalize">{order.payment_method || "Card"}</span>
            </div>
          </div>
        </div>

        {order.status !== "refunded" && !showCancelForm && (
          <button
            onClick={() => setShowCancelForm(true)}
            className="w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold hover:bg-[#a40017] transition-colors mb-4"
          >
            Request Cancellation
          </button>
        )}

        {showCancelForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-[#4d212a] mb-4">Why are you cancelling?</h3>
            <div className="space-y-3">
              {[
                "Order taking too long",
                "Changed my mind",
                "Ordered from wrong restaurant",
                "Found a better deal elsewhere",
                "Accidental order",
                "Other",
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    cancelReason === reason
                      ? "border-[#ba001c] bg-[#ffecee]"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-[#ba001c]"
                  />
                  <span className="text-sm text-[#4d212a]">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelForm(false)}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-[#4d212a]"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 bg-[#ba001c] text-white py-3 rounded-xl font-bold hover:bg-[#a40017] transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#4d212a] mb-4">Refund Status</h3>
          <div className="space-y-4 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />
            
            {refundTimeline.map((step, index) => (
              <div key={step.status} className={`relative flex items-start gap-4 ${!step.completed ? "opacity-40" : ""}`}>
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? "bg-[#ba001c] text-white" 
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {step.completed ? (
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h4 className={`font-bold ${step.completed ? "text-[#4d212a]" : "text-slate-400"}`}>
                    {step.label}
                  </h4>
                  <p className="text-xs text-[#814c55]">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <p className="font-bold text-blue-700">Refund Timeline</p>
              <p className="text-sm text-blue-600">
                Refunds typically take 2-5 business days to process, depending on your bank.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Link 
            href="/app/orders"
            className="flex-1 text-center py-4 border-2 border-slate-200 rounded-xl font-bold text-[#4d212a] hover:border-[#ba001c] transition-colors"
          >
            View All Orders
          </Link>
          <Link 
            href="/app/support"
            className="flex-1 text-center py-4 border-2 border-slate-200 rounded-xl font-bold text-[#4d212a] hover:border-[#ba001c] transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}