"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  vendor_reply?: string | null;
  user: { full_name: string; avatar_url?: string } | null;
}

interface VendorReviewsProps {
  vendorId: string;
}

function VendorReviews({ vendorId }: VendorReviewsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

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
        const total = data.reduce((sum: number, r: Review) => sum + r.rating, 0);
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

  if (loading)
    return (
      <div className="py-4 text-center text-[var(--color-outline-variant)]">Loading reviews...</div>
    );

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <p className="py-4 text-center text-[var(--color-outline-variant)]">No reviews yet</p>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-xl bg-[var(--color-surface-subtle)] p-4">
            <div className="text-center">
              <span className="text-4xl font-black text-[var(--color-on-surface)]">
                {avgRating.toFixed(1)}
              </span>
              <div className="mt-1 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-sm"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color:
                        star <= Math.round(avgRating)
                          ? "var(--color-tertiary)"
                          : "var(--color-border-subtle)",
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-[var(--color-outline)]">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star as keyof typeof ratingCounts];
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-xs font-bold text-[var(--color-on-surface-variant)]">
                      {star}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                      <div
                        className="bg-tertiary h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-xs text-[var(--color-outline-variant)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-on-primary flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold">
                      {review.user?.full_name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        {review.user?.full_name || "User"}
                      </p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined text-xs"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                              color:
                                star <= review.rating
                                  ? "var(--color-tertiary)"
                                  : "var(--color-border-subtle)",
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-outline-variant)]">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                    {review.comment}
                  </p>
                )}
                {review.vendor_reply && (
                  <div className="mt-2 ml-2 rounded-r-lg border-l-2 border-green-400 bg-green-50 p-2 pl-3 dark:border-green-600 dark:bg-green-900/20">
                    <p className="mb-0.5 text-[10px] font-bold text-green-700 dark:text-green-300">
                      Vendor reply
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200">
                      {review.vendor_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(VendorReviews);
