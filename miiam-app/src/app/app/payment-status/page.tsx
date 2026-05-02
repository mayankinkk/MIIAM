"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

type PaymentStatus = "processing" | "success" | "failed" | "pending";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status") as PaymentStatus;
  
  const [status, setStatus] = useState<PaymentStatus>(statusParam || "processing");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "processing") {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setStatus("success");
            return 100;
          }
          return p + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const statusConfig = {
    processing: {
      icon: "sync",
      title: "Processing Payment",
      message: "Please wait while we process your payment...",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    success: {
      icon: "check_circle",
      title: "Payment Successful!",
      message: "Your payment has been processed successfully.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    failed: {
      icon: "error",
      title: "Payment Failed",
      message: "There was an issue processing your payment. Please try again.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    pending: {
      icon: "hourglass_empty",
      title: "Payment Pending",
      message: "Your payment is pending. We'll notify you once it's confirmed.",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full ${config.bgColor} flex items-center justify-center mb-6`}>
              <span className={`material-symbols-outlined text-6xl ${config.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {config.icon}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#4d212a] mb-2">{config.title}</h1>
            <p className="text-[#814c55]">{config.message}</p>
          </div>

          {status === "processing" && (
            <div className="mb-8">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-2">{progress}% complete</p>
            </div>
          )}

          {orderId && (
            <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor} mb-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#814c55] uppercase tracking-widest">Order ID</p>
                  <p className="font-bold text-[#4d212a]">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
                <Link 
                  href={`/app/orders/${orderId}`}
                  className="text-[#0b50d5] font-bold text-sm hover:underline"
                >
                  View Order
                </Link>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => router.push("/app/checkout")}
                className="w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold hover:bg-[#a40017] transition-colors"
              >
                Try Again
              </button>
              <Link 
                href="/app/support"
                className="block w-full text-center text-[#ba001c] font-bold py-3"
              >
                Contact Support
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3 mb-6">
              <Link 
                href={`/app/orders/${orderId}`}
                className="block w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold text-center hover:bg-[#a40017] transition-colors"
              >
                Track Order
              </Link>
              <Link 
                href="/app/food"
                className="block w-full text-center text-[#ba001c] font-bold py-3"
              >
                Order More
              </Link>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-6 border-t border-slate-100">
            <Link href="/app/home" className="flex items-center gap-2 text-[#814c55] hover:text-[#ba001c] transition-colors">
              <span className="material-symbols-outlined">home</span>
              <span className="font-bold text-sm">Home</span>
            </Link>
            <Link href="/app/orders" className="flex items-center gap-2 text-[#814c55] hover:text-[#ba001c] transition-colors">
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="font-bold text-sm">Orders</span>
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-[#814c55]">
          Payment powered by MIIAM Secure
        </p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
          <div className="animate-pulse">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 mb-6"></div>
            <div className="h-6 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PaymentStatusContent />
    </Suspense>
  );
}