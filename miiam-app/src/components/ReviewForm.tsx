"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface ReviewFormProps {
  vendorId: string;
  orderId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ vendorId, orderId, onSuccess }: ReviewFormProps) {
  const supabase = createClient();
  const addToast = useToastStore((s) => s.addToast);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addToast("Please login to submit review", "warning");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        vendor_id: vendorId,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
      setSubmitted(true);
      onSuccess?.();
    } catch (error: unknown) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Error submitting review");
      addToast("Failed to submit review", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">check_circle</span>
        <h3 className="font-bold text-green-800 dark:text-green-200 mt-2">Thank you for your review!</h3>
        <p className="text-sm text-green-600 dark:text-green-400">Your feedback helps others</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Rate your experience</h3>
      
      <div className="flex items-center gap-1 mb-4" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-3"
          >
            <span 
              className="material-symbols-outlined text-4xl transition-all"
              style={{ 
                fontVariationSettings: "'FILL' 1",
                color: star <= (hoverRating || rating) ? "var(--color-tertiary)" : "var(--color-border-subtle)"
              }}
            >
              star
            </span>
          </button>
        ))}
        <span className="ml-2 text-[var(--color-on-surface-variant)] font-medium">
          {rating > 0 ? `${rating}/5` : "Tap to rate"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none mb-4"
        rows={3}
      />

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dim transition-all disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}