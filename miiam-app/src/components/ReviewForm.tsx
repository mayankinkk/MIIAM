"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  vendorId: string;
  orderId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ vendorId, orderId, onSuccess }: ReviewFormProps) {
  const supabase = createClient();
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
        alert("Please login to submit review");
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
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
        <h3 className="font-bold text-green-800 mt-2">Thank you for your review!</h3>
        <p className="text-sm text-green-600">Your feedback helps others</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4">Rate your experience</h3>
      
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1"
          >
            <span 
              className="material-symbols-outlined text-4xl transition-all"
              style={{ 
                fontVariationSettings: "'FILL' 1",
                color: star <= (hoverRating || rating) ? "#ffd700" : "#e5e7eb"
              }}
            >
              star
            </span>
          </button>
        ))}
        <span className="ml-2 text-slate-600 font-medium">
          {rating > 0 ? `${rating}/5` : "Tap to rate"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none mb-4"
        rows={3}
      />

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full py-3 bg-[#ba001c] text-white font-bold rounded-xl hover:bg-[#a00018] transition-all disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}