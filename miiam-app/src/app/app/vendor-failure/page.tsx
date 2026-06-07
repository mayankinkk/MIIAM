"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

function VendorFailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const vendorName = searchParams.get("vendor") || "the restaurant";
  const reason = searchParams.get("reason") || "The vendor was unable to accept your order";
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    {
      id: "refund",
      icon: "account_balance_wallet",
      title: "Full Refund",
      description: "Get your money back to your original payment method",
    },
    {
      id: "reorder",
      icon: "restart_alt",
      title: "Try Another Restaurant",
      description: "Browse similar restaurants that are open",
    },
    {
      id: "credit",
      icon: "stars",
      title: "MIIAM Credit",
      description: "Get bonus credits for your next order (10% extra)",
    },
  ];

  const handleOptionSelect = (id: string) => {
    setSelectedOption(id);
  };

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface-container-lowest/90 backdrop-blur-2xl shadow-sm">
        <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined text-primary">close</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        <div className="w-10" />
      </nav>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Order', href: '/app/orders' }, { label: 'Vendor Unavailable' }]} />

      <main className="pt-24 pb-12 px-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-500 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              cancel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface mb-2">Order Can't Be Fulfilled</h1>
          <p className="text-on-surface-variant">
            {vendorName} is unable to process your order right now.
          </p>
        </div>

        <div className={`bg-red-50 border border-red-200 rounded-xl p-4 mb-8`}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">info</span>
            <div>
              <p className="font-bold text-red-700">Reason</p>
              <p className="text-sm text-red-600">{reason}</p>
            </div>
          </div>
        </div>

        {orderId && (
          <div className="bg-surface-container-lowest rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Order ID</p>
                <p className="font-bold text-on-surface">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                Failed
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-on-surface">How would you like to proceed?</h2>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedOption === option.id
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedOption === option.id ? "bg-primary" : "bg-slate-100"
                }`}>
                  <span className={`material-symbols-outlined ${
                    selectedOption === option.id ? "text-white" : "text-on-surface-variant"
                  }`}>
                    {option.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{option.title}</h3>
                  <p className="text-xs text-on-surface-variant">{option.description}</p>
                </div>
                {selectedOption === option.id && (
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button
            disabled={!selectedOption}
            onClick={() => {
              if (selectedOption === "refund") {
                import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Refund request submitted. You'll receive it within 3-5 business days.", "success"));
              } else if (selectedOption === "reorder") {
                window.location.href = "/app/food";
              } else {
                import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Store credit added to your wallet.", "success"));
              }
            }}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm {selectedOption === "refund" ? "Refund" : selectedOption === "reorder" ? "Browse Restaurants" : "Get Credit"}
          </button>
          
          <div className="flex gap-3">
            <Link 
              href="/app/orders"
              className="flex-1 text-center py-4 border-2 border-outline-variant/20 rounded-xl font-bold text-on-surface hover:border-primary transition-colors"
            >
              View All Orders
            </Link>
            <Link 
              href="/app/support"
              className="flex-1 text-center py-4 border-2 border-outline-variant/20 rounded-xl font-bold text-on-surface hover:border-primary transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-surface-container rounded-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">support_agent</span>
            <div>
              <p className="font-bold text-on-surface">Need immediate help?</p>
              <p className="text-sm text-on-surface-variant">Contact our 24/7 support team</p>
            </div>
          </div>
          <Link href="/app/support" className="mt-3 w-full bg-secondary text-white py-3 rounded-lg font-bold text-sm text-center block">
            Chat with Support
          </Link>
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-48"></div>
      </div>
    </div>
  );
}

export default function VendorFailurePage() {
  return (
    <Suspense fallback={<Loading />}>
      <VendorFailureContent />
    </Suspense>
  );
}