"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";

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
    <div className="min-h-screen bg-[#fff4f4]">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-2xl shadow-sm">
        <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
          <span className="material-symbols-outlined text-[#ba001c]">close</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        <div className="w-10" />
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-500 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              cancel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#4d212a] mb-2">Order Can't Be Fulfilled</h1>
          <p className="text-[#814c55]">
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
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#814c55] uppercase tracking-widest">Order ID</p>
                <p className="font-bold text-[#4d212a]">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                Failed
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-[#4d212a]">How would you like to proceed?</h2>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedOption === option.id
                  ? "border-[#ba001c] bg-[#ffecee]"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedOption === option.id ? "bg-[#ba001c]" : "bg-slate-100"
                }`}>
                  <span className={`material-symbols-outlined ${
                    selectedOption === option.id ? "text-white" : "text-slate-600"
                  }`}>
                    {option.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#4d212a]">{option.title}</h3>
                  <p className="text-xs text-[#814c55]">{option.description}</p>
                </div>
                {selectedOption === option.id && (
                  <span className="material-symbols-outlined text-[#ba001c]" style={{ fontVariationSettings: "'FILL' 1" }}>
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
            className="w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold hover:bg-[#a40017] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm {selectedOption === "refund" ? "Refund" : selectedOption === "reorder" ? "Browse Restaurants" : "Get Credit"}
          </button>
          
          <div className="flex gap-3">
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
              Get Help
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0b50d5]">support_agent</span>
            <div>
              <p className="font-bold text-[#4d212a]">Need immediate help?</p>
              <p className="text-sm text-[#814c55]">Contact our 24/7 support team</p>
            </div>
          </div>
          <button className="mt-3 w-full bg-[#0b50d5] text-white py-3 rounded-lg font-bold text-sm">
            Chat with Support
          </button>
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
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