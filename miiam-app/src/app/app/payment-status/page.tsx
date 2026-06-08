"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

type PaymentStatus = "processing" | "success" | "failed" | "pending";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  
  useEffect(() => {
    const colors = ["#ba001c", "#ff7670", "#ffc371", "#0b50d5", "#38ef7d", "#ffd200", "#ff6a00"];
    const confetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
    }));
    setPieces(confetti);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            animation: `confetti-fall 3s ease-out forwards`,
          }}
        >
          <div
            className="rounded-sm"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              animation: `confetti-spin 2s linear infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function PaymentStatusContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status") as PaymentStatus;
  
  const [status, setStatus] = useState<PaymentStatus>(statusParam || "processing");
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

  useEffect(() => {
    if (status === "success") {
      setShowCelebration(true);
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const statusConfig = {
    processing: {
      icon: "sync",
      title: t.checkout.placingOrder,
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
    <>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart', href: '/app/cart' }, { label: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}` }]} />
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full ${config.bgColor} flex items-center justify-center mb-6`}>
              <span className={`material-symbols-outlined text-6xl ${config.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {config.icon}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-on-surface mb-2">{config.title}</h1>
            <p className="text-on-surface-variant">{config.message}</p>
          </div>

          {status === "processing" && (
            <div className="mb-8">
              <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-on-surface-variant mt-2">{progress}% complete</p>
            </div>
          )}

          {orderId && (
            <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor} mb-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Order ID</p>
                  <p className="font-bold text-on-surface">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
                <Link 
                  href={`/app/orders/${orderId}`}
                  className="text-secondary font-bold text-sm hover:underline"
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
                className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dim transition-colors"
              >
                Try Again
              </button>
              <Link 
                href="/app/support"
                className="block w-full text-center text-primary font-bold py-3"
              >
                {t.refund.contactSupport}
              </Link>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3 mb-6">
              {showCelebration && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-200 animate-bounce-in">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎉</span>
                    <div>
                      <p className="font-bold text-green-700">Order Placed!</p>
                      <p className="text-xs text-green-600">Your delicious food is being prepared</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <span className="material-symbols-outlined text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                    Estimated delivery in 30-40 mins
                  </div>
                </div>
              )}
              <Link 
                href={`/app/orders/${orderId}`}
                className="block w-full bg-primary text-white py-4 rounded-xl font-bold text-center hover:bg-primary-dim transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">order_play</span>
                {t.home.trackOrder}
              </Link>
              <Link 
                href="/app/food"
                className="block w-full text-center text-primary font-bold py-3"
              >
                {t.common.seeAll}
              </Link>
            </div>
          )}

          {/* Confetti */}
          {showConfetti && <Confetti />}

          <div className="flex justify-center gap-4 pt-6 border-t border-outline-variant/20">
            <Link href="/app/home" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">home</span>
              <span className="font-bold text-sm">{t.common.home}</span>
            </Link>
            <Link href="/app/orders" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="font-bold text-sm">{t.nav.orders}</span>
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-on-surface-variant">
          Payment powered by MIIAM Secure
        </p>
      </div>
    </div>
    </>
  );
}

function Loading() {
  return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
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