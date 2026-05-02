"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: { full_name: string; avatar_url?: string } | null;
}

interface VendorReviewsProps {
  vendorId: string;
}

export default function VendorReviews({ vendorId }: VendorReviewsProps) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  useEffect(() => {
    async function loadReviews() {
      const { data } = await supabase
        .from("reviews")
        .select("*, user:profiles(full_name, avatar_url)")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setReviews(data);
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        const avg = data.length > 0 ? total / data.length : 0;
        setAvgRating(avg);

        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.forEach((r: Review) => {
          const rating = Number(r.rating);
          if (counts[rating] !== undefined) counts[rating]++;
        });
        setRatingCounts(counts);
      }
      setLoading(false);
    }
    loadReviews();
  }, [vendorId, supabase]);

  if (loading) return <div className="text-center py-4 text-slate-400">Loading reviews...</div>;

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <p className="text-slate-400 text-center py-4">No reviews yet</p>
      ) : (
        <>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="text-center">
              <span className="text-4xl font-black text-slate-800">{avgRating.toFixed(1)}</span>
              <div className="flex gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-sm"
                    style={{ 
                      fontVariationSettings: "'FILL' 1",
                      color: star <= Math.round(avgRating) ? "#ffd700" : "#e5e7eb"
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star as keyof typeof ratingCounts];
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 w-3">{star}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#ffd700] rounded-full" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-white rounded-xl border border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ba001c] flex items-center justify-center text-white font-bold text-sm">
                      {review.user?.full_name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{review.user?.full_name || "User"}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined text-xs"
                            style={{ 
                              fontVariationSettings: "'FILL' 1",
                              color: star <= review.rating ? "#ffd700" : "#e5e7eb"
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}