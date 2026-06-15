"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RateCustomerContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || "";
  const customerName = searchParams?.get("customer") || "Customer";
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({
    addressAccurate: true,
    friendly: true,
    tipReceived: false,
  });
  const [additionalComment, setAdditionalComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/rider/login");
      else setAuthChecked(true);
    });
  }, [supabase, router]);

  const handleSubmit = async () => {
    if (selectedRating === null) {
      alert("Please give a rating");
      return;
    }
    setSubmitted(true);

    // Persist rating to database
    if (orderId) {
      try {
        await supabase
          .from("orders")
          .update({
            rider_rating: selectedRating,
            rider_feedback: {
              address_accurate: feedback.addressAccurate,
              friendly: feedback.friendly,
              tip_received: feedback.tipReceived,
              comment: additionalComment,
            },
            rider_rated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      } catch (e) {
        console.error("Failed to save rating:", e);
      }
    }

    setTimeout(() => {
      router.push("/rider/dashboard");
    }, 1500);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0b50d5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-[#4d212a] mb-2">Thank You!</h2>
          <p className="text-[var(--color-outline)]">Your feedback has been submitted</p>
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
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#0b50d5] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customerName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4d212a]">{customerName}</h2>
              <p className="text-sm text-[var(--color-outline-variant)]">Order #{orderId}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-[var(--color-outline)] mb-4">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <span 
                    className={`text-4xl ${star <= (selectedRating || 0) ? "text-yellow-400" : "text-[var(--color-outline-variant)]/60"}`}
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

        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Quick Feedback</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl cursor-pointer">
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
            <label className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl cursor-pointer">
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
            <label className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl cursor-pointer">
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

        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Additional Comments (Optional)</h3>
          <textarea 
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            placeholder="Share more about your experience..."
            className="w-full p-4 bg-[var(--color-surface-subtle)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0b50d5]"
            rows={3}
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-[#0b50d5] text-white font-black rounded-2xl text-lg"
        >
          Submit Feedback
        </button>

        <p className="text-center text-xs text-[var(--color-outline-variant)]">
          Your feedback helps improve the delivery experience
        </p>
      </main>


    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-[#0b50d5] animate-spin">sync</span>
        <p className="mt-4 text-[var(--color-outline)]">Loading...</p>
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