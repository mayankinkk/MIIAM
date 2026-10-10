"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

type FeedbackData = {
  orderId: string;
  serviceName: string;
  providerName: string;
  price: number;
};

function FeedbackContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const orderId = searchParams.get("orderId") || "";
  const serviceName = searchParams.get("service") || "Service";
  const providerName = searchParams.get("provider") || "Technician";
  const price = parseInt(searchParams.get("price") || "0");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToastStore();

  const tags = [
    "On Time",
    "Professional",
    "Good Work",
    "Recommended",
    "Would Book Again",
    "Value for Money",
    "Polite & Friendly",
    "Clean Workspace",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      addToast("Please select a rating", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to database
      await supabase.from("service_reviews").insert({
        order_id: orderId,
        service_name: serviceName,
        rating,
        review_text: review,
        tags: selectedTags,
        created_at: new Date().toISOString(),
      });

      // Also update the service booking with rating
      if (orderId) {
        await supabase
          .from("service_bookings")
          .update({ rating, review_text: review })
          .eq("id", orderId);
      }

      setSubmitted(true);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Failed to submit feedback"
      );
      addToast("Failed to submit feedback. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="from-surface flex min-h-screen items-center justify-center bg-gradient-to-b to-white p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <span
              className="material-symbols-outlined text-6xl text-green-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-on-surface mb-2 text-2xl font-black">{t.rating.thanksForRating}</h1>
          <p className="mb-8 text-[var(--color-on-surface-variant)]">
            Your feedback helps us improve our service.
          </p>
          <div className="space-y-3">
            <Link
              href="/app/home"
              className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary block w-full rounded-xl py-4 font-bold transition-all"
            >
              {t.common.home}
            </Link>
            <Link
              href="/app/services"
              className="border-primary text-accent hover:bg-surface-container-low block w-full rounded-xl border-2 py-4 font-bold transition-all"
            >
              Book Another Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="from-surface min-h-screen bg-gradient-to-b to-white">
      {/* Header */}
      <div className="border-b border-pink-100 bg-[var(--color-surface-container-lowest)] p-6">
        <Link
          href="/app/home"
          className="hover:text-accent flex items-center gap-2 text-[var(--color-on-surface-variant)]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-bold">Back</span>
        </Link>
      </div>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Feedback" }]} />

      <div className="mx-auto max-w-lg p-6">
        {/* Service Info */}
        <div className="mb-6 rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h2 className="text-on-surface mb-1 text-lg font-bold">{serviceName}</h2>
          <p className="mb-4 text-sm text-[var(--color-outline)]">by {providerName}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-outline)]">Amount Paid</span>
            <span className="text-on-surface text-xl font-black">₹{price}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6 rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h3 className="text-on-surface mb-4 text-center text-lg font-bold">
            {t.rating.subtitle}
          </h3>
          <div className="mb-4 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-2 transition-transform hover:scale-110"
              >
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                    color:
                      star <= (hoverRating || rating)
                        ? "var(--color-status-warning)"
                        : "var(--color-border-subtle)",
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-[var(--color-outline)]">
            {rating === 0 && "Tap to rate"}
            {rating === 1 && t.rating.okay}
            {rating === 2 && t.rating.good}
            {rating === 3 && t.rating.good}
            {rating === 4 && t.rating.great}
            {rating === 5 && t.rating.excellent}
          </p>
        </div>

        {/* Tags */}
        {rating > 0 && (
          <div className="animate-fade-in mb-6 rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <h3 className="text-on-surface mb-4 text-lg font-bold">What did you like?</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-on-primary"
                      : "hover:border-primary border border-pink-200 bg-pink-50 text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review */}
        {rating > 0 && (
          <div className="animate-fade-in mb-6 rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <h3 className="text-on-surface mb-4 text-lg font-bold">{t.rating.shareExperience}</h3>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about your experience..."
              className="focus:border-primary focus:ring-primary/20 w-full resize-none rounded-xl border border-pink-200 p-4 outline-none focus:ring-2"
              rows={4}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
            rating > 0
              ? "bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary"
              : "cursor-not-allowed bg-[var(--color-surface-container-high)] text-[var(--color-outline-variant)]"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function Loading() {
  return (
    <div className="from-surface flex min-h-screen items-center justify-center bg-gradient-to-b to-white">
      <div className="animate-pulse">
        <div className="mb-4 h-12 w-12 rounded-full bg-pink-200"></div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FeedbackContent />
    </Suspense>
  );
}
