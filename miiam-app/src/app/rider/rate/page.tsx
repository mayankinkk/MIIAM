"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

function RateCustomerContent() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
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
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
        if (!user) router.push("/rider/login");
        else setAuthChecked(true);
      });
  }, [supabase, router]);

  const handleSubmit = async () => {
    if (selectedRating === null) {
      import("@/lib/store/toastStore").then((m) =>
        m.useToastStore.getState().addToast("Please give a rating", "error")
      );
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
        logger.error(
          { err: e instanceof Error ? e : new Error(String(e)) },
          "Failed to save rating"
        );
      }
    }

    setTimeout(() => {
      router.push("/rider/dashboard");
    }, 1500);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="border-brand-secondary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
          </div>
          <h2 className="mb-2 text-2xl font-black text-[var(--color-on-surface)]">Thank You!</h2>
          <p className="text-[var(--color-outline)]">Your feedback has been submitted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-brand-secondary p-6 pb-12 text-white">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Rate Customer</h1>
        </div>
      </header>

      <main className="-mt-6 space-y-6 p-6 pb-32">
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-brand-secondary flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
              {customerName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)]">{customerName}</h2>
              <p className="text-sm text-[var(--color-outline-variant)]">Order #{orderId}</p>
            </div>
          </div>

          <div className="mb-6 text-center">
            <p className="mb-4 text-sm text-[var(--color-outline)]">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-2 transition-transform hover:scale-110"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
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
            <p className="mt-2 font-bold text-[var(--color-on-surface)]">
              {selectedRating === 5
                ? "Excellent"
                : selectedRating === 4
                  ? "Good"
                  : selectedRating === 3
                    ? "Average"
                    : selectedRating === 2
                      ? "Poor"
                      : selectedRating === 1
                        ? "Very Poor"
                        : "Tap to rate"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Quick Feedback</h3>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <span className="font-medium">Address was accurate</span>
              </span>
              <input
                type="checkbox"
                checked={feedback.addressAccurate}
                onChange={(e) => setFeedback({ ...feedback, addressAccurate: e.target.checked })}
                className="h-5 w-5 accent-green-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">
                  sentiment_satisfied
                </span>
                <span className="font-medium">Customer was friendly</span>
              </span>
              <input
                type="checkbox"
                checked={feedback.friendly}
                onChange={(e) => setFeedback({ ...feedback, friendly: e.target.checked })}
                className="h-5 w-5 accent-green-500"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600">volunteer_activism</span>
                <span className="font-medium">Received tip</span>
              </span>
              <input
                type="checkbox"
                checked={feedback.tipReceived}
                onChange={(e) => setFeedback({ ...feedback, tipReceived: e.target.checked })}
                className="h-5 w-5 accent-green-500"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">
            Additional Comments (Optional)
          </h3>
          <textarea
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            placeholder="Share more about your experience..."
            className="focus:ring-brand-secondary w-full rounded-xl bg-[var(--color-surface-subtle)] p-4 text-sm focus:ring-2 focus:outline-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-brand-secondary w-full rounded-2xl py-4 text-lg font-black text-white"
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
      <div className="text-center">
        <span className="material-symbols-outlined text-brand-secondary animate-spin text-4xl">
          sync
        </span>
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
