"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VendorReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = createClient();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");

  useEffect(() => {
    async function loadData() {
      const [{ data: vendorData }, { data: reviewsData }] = await Promise.all([
        supabase.from("vendors").select("shop_name, rating, review_count").eq("id", vendorId).single(),
        supabase
          .from("reviews")
          .select("*, profile:profiles(full_name, avatar_url)")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
      ]);

      if (vendorData) setVendor(vendorData);
      if (reviewsData) setReviews(reviewsData);
      setLoading(false);
    }
    loadData();
  }, [vendorId]);

  const filteredReviews = filter === "all" 
    ? reviews 
    : reviews.filter((r) => r.rating === parseInt(filter));

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">{vendor?.shop_name}</h1>
            <p className="text-sm text-slate-500">All Reviews</p>
          </div>
        </div>
      </header>

      {/* Rating Summary */}
      <div className="bg-white border-b border-slate-100 p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800">{vendor?.rating || "4.5"}</p>
            <p className="text-xs text-slate-500">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-3">{star}</span>
                <span className="material-symbols-outlined text-[#ba001c] text-sm">star</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ba001c] rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                filter === f ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {f === "all" ? "All" : `${f} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-4 space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No reviews yet</div>
        ) : (
          filteredReviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#ba001c] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">{review.profile?.full_name || "User"}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${
                          star <= review.rating ? "text-[#ba001c]" : "text-slate-300"
                        }`}
                        style={{ fontVariationSettings: `'FILL' ${star <= review.rating ? 1 : 0}` }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-slate-600 mt-2">{review.review_text}</p>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {review.tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}