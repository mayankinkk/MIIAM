"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import logger from "@/lib/logger";

interface Review {
  id: string;
  vendor_id: string;
  rider_id: string | null;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_approved: boolean;
  is_highlighted: boolean;
  profile?: { full_name: string };
}

export default function ReviewsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "vendor" | "rider">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadReviews();

    const channel = supabase
      .channel("reviews-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        loadReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, filter]);

  async function loadReviews() {
    const query = supabase
      .from("reviews")
      .select("*, profile:profiles(full_name)")
      .order("created_at", { ascending: false });
    const { data } = await query;
    if (data) setReviews(data);
    setLoading(false);
  }

  async function deleteReview(id: string) {
    if (
      await confirm({
        title: "Delete Review",
        message: "Are you sure you want to delete this review? This action cannot be undone.",
        variant: "danger",
      })
    ) {
      await supabase.from("reviews").delete().eq("id", id);
      setReviews(reviews.filter((r) => r.id !== id));
    }
  }

  async function toggleStatus(
    id: string,
    currentStatus: boolean,
    field: "is_approved" | "is_highlighted"
  ) {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ [field]: !currentStatus })
        .eq("id", id);
      if (error) {
        logger.error(
          { err: error instanceof Error ? error : new Error(String(error)) },
          "Review update failed"
        );
        useToastStore
          .getState()
          .addToast(
            "Could not update review. Ensure database schema supports this field.",
            "error"
          );
        return;
      }
      setReviews(reviews.map((r) => (r.id === id ? { ...r, [field]: !currentStatus } : r)));
    } catch (e) {
      logger.error({ err: e instanceof Error ? e : new Error(String(e)) }, "Review toggle error");
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (filter === "vendor" && !r.vendor_id) return false;
    if (filter === "rider" && !r.rider_id) return false;
    if (search && !r.comment?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  function toggleSelectAll() {
    if (selectedIds.size === filteredReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exportToCSV() {
    const headers = ["User", "Rating", "Comment", "Type", "Approved", "Highlighted", "Date"];
    const rows = filteredReviews
      .filter((r) => selectedIds.size === 0 || selectedIds.has(r.id))
      .map((r) => [
        r.profile?.full_name || "User",
        r.rating,
        r.comment || "",
        r.vendor_id ? "Vendor" : "Rider",
        r.is_approved ? "Yes" : "No",
        r.is_highlighted ? "Yes" : "No",
        new Date(r.created_at).toLocaleDateString(),
      ]);
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function bulkDelete() {
    if (
      await confirm({
        title: "Bulk Delete",
        message: `Delete ${selectedIds.size} reviews? This cannot be undone.`,
        variant: "danger",
      })
    ) {
      await supabase.from("reviews").delete().in("id", Array.from(selectedIds));
      setReviews(reviews.filter((r) => !selectedIds.has(r.id)));
      useToastStore.getState().addToast(`${selectedIds.size} reviews deleted`, "success");
      setSelectedIds(new Set());
    }
  }

  async function bulkApprove() {
    await supabase.from("reviews").update({ is_approved: true }).in("id", Array.from(selectedIds));
    setReviews(reviews.map((r) => (selectedIds.has(r.id) ? { ...r, is_approved: true } : r)));
    useToastStore.getState().addToast(`${selectedIds.size} reviews approved`, "success");
    setSelectedIds(new Set());
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;
  const oneStars = reviews.filter((r) => r.rating === 1).length;

  if (loading) return <div className="px-8">Loading reviews...</div>;

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Reviews
          </h1>
          <p className="text-[var(--color-outline)]">Manage customer feedback and ratings.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total Reviews
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{reviews.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="mb-1 text-xs font-black tracking-widest text-amber-600 uppercase dark:text-amber-400">
            Avg Rating
          </p>
          <p className="flex items-center gap-1 text-3xl font-black text-amber-600 dark:text-amber-400">
            {avgRating} <span className="material-symbols-outlined text-xl">star</span>
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            5-Star Reviews
          </p>
          <p className="text-3xl font-black text-green-600">{fiveStars}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            1-Star Reviews
          </p>
          <p className="text-3xl font-black text-red-500">{oneStars}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {(["all", "vendor", "rider"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                filter === f
                  ? "text-on-primary bg-[var(--color-primary)]"
                  : "bg-[var(--color-surface-subtle)] text-[var(--color-outline)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} Reviews
            </button>
          ))}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute top-2.5 left-3 text-sm text-[var(--color-outline-variant)]">
              search
            </span>
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search reviews"
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] py-2 pr-4 pl-10 text-sm focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter reviews from date"
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter reviews to date"
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-2">
            {selectedIds.size === 0 ? (
              <button
                onClick={toggleSelectAll}
                className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-on-surface)]"
              >
                Select All
              </button>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--color-outline-variant)]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-on-surface)]"
                >
                  Deselect All
                </button>
                <button
                  onClick={bulkApprove}
                  className="rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={bulkDelete}
                  className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                >
                  Bulk Delete
                </button>
              </>
            )}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="max-h-[500px] divide-y divide-slate-50 overflow-y-auto">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-4 hover:bg-[var(--color-surface-subtle)]">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(review.id)}
                  onChange={() => toggleSelect(review.id)}
                  className="mt-2 h-4 w-4 flex-shrink-0 accent-[var(--color-primary)]"
                />
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] font-bold text-[var(--color-on-surface-variant)]">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-bold text-[var(--color-on-surface)]">
                      {review.profile?.full_name || "User"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-sm ${star <= review.rating ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}`}
                          style={{
                            fontVariationSettings: star <= review.rating ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mb-1 text-sm text-[var(--color-on-surface-variant)]">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-outline-variant)]">
                    {review.vendor_id ? "Vendor Review" : "Rider Review"} •{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => toggleStatus(review.id, review.is_approved, "is_approved")}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${review.is_approved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}
                  >
                    {review.is_approved ? "Approved" : "Pending"}
                  </button>
                  <button
                    onClick={() => toggleStatus(review.id, review.is_highlighted, "is_highlighted")}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${review.is_highlighted ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {review.is_highlighted ? "Highlighted" : "Highlight"}
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="flex justify-end p-1 text-red-500 hover:text-red-700"
                    aria-label="Delete review"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="p-8 text-center text-[var(--color-outline-variant)]">
              No reviews found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
