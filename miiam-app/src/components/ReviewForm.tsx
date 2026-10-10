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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        addToast("Please login to submit review", "warning");
        setLoading(false);
        return;
      }

      // Check for existing review
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("vendor_id", vendorId)
        .maybeSingle();

      if (existingReview) {
        addToast("You have already reviewed this vendor", "warning");
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
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error submitting review"
      );
      addToast("Failed to submit review", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-status-success/10 border-status-success/20 rounded-xl border p-6 text-center">
        <span className="material-symbols-outlined text-status-success text-4xl">check_circle</span>
        <h3 className="text-status-success mt-2 font-bold">Thank you for your review!</h3>
        <p className="text-status-success text-sm">Your feedback helps others</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
    >
      <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Rate your experience</h3>

      <div className="mb-4 flex items-center gap-1" role="radiogroup" aria-label="Rating">
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
                color:
                  star <= (hoverRating || rating)
                    ? "var(--color-tertiary)"
                    : "var(--color-border-subtle)",
              }}
            >
              star
            </span>
          </button>
        ))}
        <span className="ml-2 font-medium text-[var(--color-on-surface-variant)]">
          {rating > 0 ? `${rating}/5` : "Tap to rate"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        className="mb-4 w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
        rows={3}
      />

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary w-full rounded-xl py-3 font-bold transition-all disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
