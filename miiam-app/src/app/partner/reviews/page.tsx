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
    setSaving((prev) => ({ ...prev, [reviewId]: true }));
    const reply = replyInputs[reviewId]?.trim();
    if (!reply) return;

    const res = await fetch("/api/vendor/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": "1" },
      body: JSON.stringify({ reviewId, reply }),
    });

    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, vendor_reply: reply, vendor_reply_at: new Date().toISOString() }
            : r
        )
      );
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
    }
    setSaving((prev) => ({ ...prev, [reviewId]: false }));
  }

  async function deleteReply(reviewId: string) {
    const res = await fetch(`/api/vendor/reply?reviewId=${reviewId}`, {
      method: "DELETE",
      headers: { "x-csrf-token": "1" },
    });
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, vendor_reply: null, vendor_reply_at: null } : r
        )
      );
    }
  }

  const stats = {
    total: reviews.length,
    average: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0",
    withReplies: reviews.filter((r) => r.vendor_reply).length,
    unreplied: reviews.filter((r) => !r.vendor_reply).length,
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
          storefront
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          No Vendor Found
        </h2>
        <p className="text-[var(--color-outline)]">Register your store first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">Reviews</h1>
          <p className="mt-1 text-sm text-[var(--color-outline)]">Respond to customer reviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.total}</p>
          <p className="mt-1 text-xs text-[var(--color-outline)]">Total</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4 text-center">
          <p className="text-2xl font-black text-amber-500">{stats.average}</p>
          <p className="mt-1 text-xs text-[var(--color-outline)]">Avg Rating</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4 text-center">
          <p className="text-2xl font-black text-green-600 dark:text-green-400">
            {stats.withReplies}
          </p>
          <p className="mt-1 text-xs text-[var(--color-outline)]">Replied</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.unreplied}</p>
          <p className="mt-1 text-xs text-[var(--color-outline)]">Awaiting Reply</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
              reviews
            </span>
            <p className="mt-3 text-[var(--color-outline)]">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary text-on-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[var(--color-on-surface)]">
                      {review.profile?.full_name || "User"}
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`material-symbols-outlined text-sm ${s <= review.rating ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-outline-variant)]">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                  {review.review_text && (
                    <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                      {review.review_text}
                    </p>
                  )}

                  {/* Vendor Reply */}
                  {review.vendor_reply && (
                    <div className="border-primary bg-primary/5 mt-3 ml-4 rounded-r-lg border-l-2 p-3 pl-3">
                      <p className="text-primary mb-1 text-xs font-bold">Your Reply</p>
                      <p className="text-sm text-[var(--color-on-surface)]">
                        {review.vendor_reply}
                      </p>
                      {review.vendor_reply_at && (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-[10px] text-[var(--color-outline-variant)]">
                            {new Date(review.vendor_reply_at).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => deleteReply(review.id)}
                            aria-label="Remove reply"
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            Remove
                          </button>
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
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        placeholder="Write a reply..."
                        maxLength={500}
                        className="focus:ring-primary/30 flex-1 rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      />
                      <button
                        onClick={() => saveReply(review.id)}
                        disabled={!replyInputs[review.id]?.trim() || saving[review.id]}
                        className="bg-primary text-on-primary hover:bg-primary-dim rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50"
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
