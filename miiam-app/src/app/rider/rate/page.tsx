"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const completedOrders = [
  { id: "ORD001", customer: "Priya S.", date: "Today, 2:30 PM", rating: null },
  { id: "ORD002", customer: "Amit K.", date: "Today, 12:15 PM", rating: null },
  { id: "ORD003", customer: "Rahul M.", date: "Yesterday, 8:45 PM", rating: null },
];

function RateCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || "ORD001";
  const customerName = searchParams?.get("customer") || "Customer";
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({
    addressAccurate: true,
    friendly: true,
    tipReceived: false,
  });
  const [additionalComment, setAdditionalComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedRating === null) {
      alert("Please give a rating");
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      router.push("/rider/dashboard");
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-[#4d212a] mb-2">Thank You!</h2>
          <p className="text-slate-500">Your feedback has been submitted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-12">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Rate Customer</h1>
        </div>
      </header>

      <main className="p-6 -mt-6 space-y-6 pb-32">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#0b50d5] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customerName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4d212a]">{customerName}</h2>
              <p className="text-sm text-slate-400">Order #{orderId}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 mb-4">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <span 
                    className={`text-4xl ${star <= (selectedRating || 0) ? "text-yellow-400" : "text-slate-300"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 font-bold text-[#4d212a]">
              {selectedRating === 5 ? "Excellent" : 
               selectedRating === 4 ? "Good" : 
               selectedRating === 3 ? "Average" : 
               selectedRating === 2 ? "Poor" : 
               selectedRating === 1 ? "Very Poor" : "Tap to rate"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Quick Feedback</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <span className="font-medium">Address was accurate</span>
              </span>
              <input 
                type="checkbox" 
                checked={feedback.addressAccurate}
                onChange={(e) => setFeedback({...feedback, addressAccurate: e.target.checked})}
                className="w-5 h-5 accent-green-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">sentiment_satisfied</span>
                <span className="font-medium">Customer was friendly</span>
              </span>
              <input 
                type="checkbox" 
                checked={feedback.friendly}
                onChange={(e) => setFeedback({...feedback, friendly: e.target.checked})}
                className="w-5 h-5 accent-green-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600">volunteer_activism</span>
                <span className="font-medium">Received tip</span>
              </span>
              <input 
                type="checkbox" 
                checked={feedback.tipReceived}
                onChange={(e) => setFeedback({...feedback, tipReceived: e.target.checked})}
                className="w-5 h-5 accent-green-500"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Additional Comments (Optional)</h3>
          <textarea 
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            placeholder="Share more about your experience..."
            className="w-full p-4 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b50d5]"
            rows={3}
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-[#0b50d5] text-white font-black rounded-2xl text-lg"
        >
          Submit Feedback
        </button>

        <p className="text-center text-xs text-slate-400">
          Your feedback helps improve the delivery experience
        </p>
      </main>

      <RiderNavBar />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[#0b50d5] animate-spin">sync</span>
        <p className="mt-4 text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export default function RateCustomerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RateCustomerContent />
    </Suspense>
  );
}

function RiderNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      <Link href="/rider/dashboard" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">map</span>
        <span className="text-[10px] font-bold">Map</span>
      </Link>
      <Link href="/rider/orders" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">list_alt</span>
        <span className="text-[10px] font-bold">Orders</span>
      </Link>
      <Link href="/rider/wallet" className="flex flex-col items-center p-2 text-slate-400">
        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
        <span className="text-[10px] font-bold">Wallet</span>
      </Link>
      <Link href="/rider/account" className="flex flex-col items-center p-2 text-[#0b50d5]">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        <span className="text-[10px] font-bold">Account</span>
      </Link>
    </nav>
  );
}