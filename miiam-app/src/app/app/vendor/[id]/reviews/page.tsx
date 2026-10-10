"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyStates";
import { ListSkeleton } from "@/components/Skeleton";

interface VendorData {
  shop_name: string;
  rating: number;
  review_count: number;
}

interface ReviewData {
  id: string;
  rating: number;
  review_text: string | null;
  tags: string[] | null;
  vendor_reply: string | null;
  photos: string[] | null;
  item_name: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type SortKey = "newest" | "highest" | "lowest";

export default function VendorReviewsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: vendorData }, { data: reviewsData }] = await Promise.all([
          supabase
            .from("vendors")
            .select("shop_name, rating, review_count")
            .eq("id", vendorId)
            .single(),
          supabase
            .from("reviews")
            .select("*, profile:profiles(full_name, avatar_url)")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false }),
        ]);

        if (vendorData) setVendor(vendorData);
        if (reviewsData) setReviews(reviewsData);
      } catch (err) {
        logger.error({ err }, "Failed to load reviews");
      }
      setLoading(false);
    }
    loadData();
  }, [vendorId]);

  const filteredReviews = (() => {
    const base = filter === "all" ? reviews : reviews.filter((r) => r.rating === parseInt(filter));
    const sorted = [...base];
    if (sort === "newest")
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sort === "highest")
      sorted.sort(
        (a, b) =>
          b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sort === "lowest")
      sorted.sort(
        (a, b) =>
          a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    return sorted;
  })();

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] p-4" aria-label="Loading...">
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="-ml-2 rounded-full p-2 hover:bg-[var(--color-surface-container)]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--color-on-surface)]">
              {vendor?.shop_name}
            </h1>
            <p className="text-sm text-[var(--color-outline)]">
              {t.food.all} {t.food.reviews}
            </p>
          </div>
        </div>
      </header>
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Reviews" }]} />
      {/* Rating Summary */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-black text-[var(--color-on-surface)]">
              {vendor?.rating || "4.5"}
            </p>
            <p className="text-xs text-[var(--color-outline)]">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-xs text-[var(--color-on-surface-variant)]">{star}</span>
                <span className="material-symbols-outlined text-accent text-sm">star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-[var(--color-outline-variant)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter + Sort */}
      <div className="space-y-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap ${
                filter === f
                  ? "bg-primary text-on-primary"
                  : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
              }`}
            >
              {f === "all" ? t.food.all : `${f} ★`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              ["newest", "Newest"],
              ["highest", "Highest rated"],
              ["lowest", "Lowest rated"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                sort === key
                  ? "bg-accent/15 text-accent"
                  : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
              }`}
            >
              {sort === key && <span className="material-symbols-outlined text-xs">check</span>}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 p-4">
        {filteredReviews.length === 0 ? (
          <EmptyState icon="⭐" title={t.food.noReviews} description={t.food.beFirst} />
        ) : (
          filteredReviews.map((review: ReviewData) => (
            <div
              key={review.id}
              className="rounded-xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary text-on-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[var(--color-on-surface)]">
                      {review.profile?.full_name || "User"}
                    </p>
                    <span className="text-xs text-[var(--color-outline-variant)]">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="my-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${
                          star <= review.rating
                            ? "text-accent"
                            : "text-[var(--color-outline-variant)]/60"
                        }`}
                        style={{ fontVariationSettings: `'FILL' ${star <= review.rating ? 1 : 0}` }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {review.item_name && (
                    <span className="bg-primary/15 text-accent mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[11px]">restaurant</span>
                      {review.item_name}
                    </span>
                  )}
                  {review.review_text && (
                    <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                      {review.review_text}
                    </p>
                  )}
                  {review.photos && review.photos.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {review.photos.map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightboxPhoto(photo)}
                          className="h-16 w-16 overflow-hidden rounded-lg border border-[var(--color-border-subtle)] transition-opacity hover:opacity-80"
                          aria-label="View review photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt="Review photo"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {review.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--color-surface-container)] px-2 py-1 text-xs text-[var(--color-on-surface-variant)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {review.vendor_reply && (
                    <div className="mt-3 ml-2 rounded-r-lg border-l-2 border-green-400 bg-green-50 p-3 pl-3">
                      <p className="mb-0.5 text-[10px] font-bold text-green-700">Vendor reply</p>
                      <p className="text-xs text-green-800">{review.vendor_reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto}
            alt="Review photo enlarged"
            className="max-h-[80vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
