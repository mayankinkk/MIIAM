"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
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
    if (rating === 0) return;
    
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
      console.error("Failed to submit feedback:", error);
      addToast("Failed to submit feedback. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-green-500 text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h1 className="text-2xl font-black text-on-surface mb-2">{t.rating.thanksForRating}</h1>
          <p className="text-slate-600 mb-8">
            Your feedback helps us improve our service.
          </p>
          <div className="space-y-3">
            <Link
              href="/app/home"
              className="block w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dim transition-all"
            >
              {t.common.home}
            </Link>
            <Link
              href="/app/services"
              className="block w-full py-4 border-2 border-primary text-primary rounded-xl font-bold hover:bg-surface-container-low transition-all"
            >
              Book Another Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-white">
      {/* Header */}
      <div className="bg-[var(--color-surface-container-lowest)] p-6 border-b border-pink-100">
        <Link href="/app/home" className="flex items-center gap-2 text-slate-600 hover:text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-bold">Back</span>
        </Link>
      </div>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Feedback' }]} />

      <div className="max-w-lg mx-auto p-6">
        {/* Service Info */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-on-surface mb-1">{serviceName}</h2>
          <p className="text-sm text-slate-500 mb-4">by {providerName}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Amount Paid</span>
            <span className="text-xl font-black text-primary">₹{price}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-on-surface mb-4 text-center">
            {t.rating.subtitle}
          </h3>
          <div className="flex justify-center gap-2 mb-4">
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
                    color: star <= (hoverRating || rating) ? "#f59e0b" : "#d1d5db",
                  }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-slate-500">
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
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-on-surface mb-4">What did you like?</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-white"
                      : "bg-pink-50 text-slate-600 border border-pink-200 hover:border-primary"
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
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg mb-6 animate-fade-in">
            <h3 className="text-lg font-bold text-on-surface mb-4">
              {t.rating.shareExperience}
            </h3>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full p-4 rounded-xl border border-pink-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              rows={4}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            rating > 0
              ? "bg-primary text-white hover:bg-primary-dim"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : "Submit Feedback"}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
    <div className="min-h-screen bg-gradient-to-b from-surface to-white flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-pink-200 rounded-full mb-4"></div>
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