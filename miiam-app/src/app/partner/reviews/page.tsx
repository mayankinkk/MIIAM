"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";
import { VendorTableSkeleton } from "@/components/vendor/VendorSkeleton";

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  user_id: string;
  created_at: string;
  profile?: { full_name?: string; avatar_url?: string };
  vendor_reply?: string | null;
  vendor_reply_at?: string | null;
}

export default function PartnerReviewsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [vendor, setVendor] = useState<{ id: string; shop_name: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const v = await getVendorForUser();
    if (v) {
      setVendor({ id: v.id, shop_name: v.shop_name });
      loadReviews(v.id);
    }
    setLoading(false);
  }

  async function loadReviews(vendorId: string) {
    const { data } = await supabase
      .from("reviews")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
  }

  async function saveReply(reviewId: string) {
    setSaving(prev => ({ ...prev, [reviewId]: true }));
    const reply = replyInputs[reviewId]?.trim();
    if (!reply) return;

    const res = await fetch("/api/vendor/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, reply }),
    });

    if (res.ok) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, vendor_reply: reply, vendor_reply_at: new Date().toISOString() } : r
      ));
      setReplyInputs(prev => ({ ...prev, [reviewId]: "" }));
    }
    setSaving(prev => ({ ...prev, [reviewId]: false }));
  }

  async function deleteReply(reviewId: string) {
    const res = await fetch(`/api/vendor/reply?reviewId=${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, vendor_reply: null, vendor_reply_at: null } : r
      ));
    }
  }

  const stats = {
    total: reviews.length,
    average: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0",
    withReplies: reviews.filter(r => r.vendor_reply).length,
    unreplied: reviews.filter(r => !r.vendor_reply).length,
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <VendorTableSkeleton rows={3} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)] mb-2">No Vendor Found</h2>
        <p className="text-[var(--color-outline)]">Register your store first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">Reviews</h1>
          <p className="text-[var(--color-outline)] text-sm mt-1">Respond to customer reviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)] text-center">
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.total}</p>
          <p className="text-xs text-[var(--color-outline)] mt-1">Total</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)] text-center">
          <p className="text-2xl font-black text-amber-500">{stats.average}</p>
          <p className="text-xs text-[var(--color-outline)] mt-1">Avg Rating</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)] text-center">
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.withReplies}</p>
          <p className="text-xs text-[var(--color-outline)] mt-1">Replied</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)] text-center">
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.unreplied}</p>
          <p className="text-xs text-[var(--color-outline)] mt-1">Awaiting Reply</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-12 text-center border border-[var(--color-border-subtle)]">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">reviews</span>
            <p className="text-[var(--color-outline)] mt-3">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-5 border border-[var(--color-border-subtle)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold text-[var(--color-on-surface)]">{review.profile?.full_name || "User"}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={`material-symbols-outlined text-sm ${s <= review.rating ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-outline-variant)] mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
                  {review.review_text && <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">{review.review_text}</p>}

                  {/* Vendor Reply */}
                  {review.vendor_reply && (
                    <div className="mt-3 ml-4 pl-3 border-l-2 border-primary bg-primary/5 p-3 rounded-r-lg">
                      <p className="text-xs font-bold text-primary mb-1">Your Reply</p>
                      <p className="text-sm text-[var(--color-on-surface)]">{review.vendor_reply}</p>
                      {review.vendor_reply_at && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-[var(--color-outline-variant)]">{new Date(review.vendor_reply_at).toLocaleDateString()}</p>
                          <button onClick={() => deleteReply(review.id)} className="text-[10px] text-red-500 hover:underline">Remove</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Input */}
                  {!review.vendor_reply && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyInputs[review.id] || ""}
                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        maxLength={500}
                        className="flex-1 px-3 py-2 text-sm border border-[var(--color-border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => saveReply(review.id)}
                        disabled={!replyInputs[review.id]?.trim() || saving[review.id]}
                        className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dim disabled:opacity-50 transition-colors"
                      >
                        {saving[review.id] ? "..." : "Reply"}
                      </button>
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
