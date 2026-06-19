"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";

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
    const query = supabase.from("reviews").select("*, profile:profiles(full_name)").order("created_at", { ascending: false });
    const { data } = await query;
    if (data) setReviews(data);
    setLoading(false);
  }

  async function deleteReview(id: string) {
    if (await confirm({ title: "Delete Review", message: "Are you sure you want to delete this review? This action cannot be undone.", variant: "danger" })) {
      await supabase.from("reviews").delete().eq("id", id);
      setReviews(reviews.filter(r => r.id !== id));
    }
  }

  async function toggleStatus(id: string, currentStatus: boolean, field: 'is_approved' | 'is_highlighted') {
    try {
      const { error } = await supabase.from("reviews").update({ [field]: !currentStatus }).eq("id", id);
      if (error) {
        console.error("Update failed:", error);
        useToastStore.getState().addToast("Could not update review. Ensure database schema supports this field.", "error");
        return;
      }
      setReviews(reviews.map(r => r.id === id ? { ...r, [field]: !currentStatus } : r));
    } catch (e) {
      console.error(e);
    }
  }

  const filteredReviews = reviews.filter(r => {
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
      setSelectedIds(new Set(filteredReviews.map(r => r.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function exportToCSV() {
    const headers = ["User", "Rating", "Comment", "Type", "Approved", "Highlighted", "Date"];
    const rows = filteredReviews.filter(r => selectedIds.size === 0 || selectedIds.has(r.id)).map(r => [
      r.profile?.full_name || "User",
      r.rating,
      r.comment || "",
      r.vendor_id ? "Vendor" : "Rider",
      r.is_approved ? "Yes" : "No",
      r.is_highlighted ? "Yes" : "No",
      new Date(r.created_at).toLocaleDateString()
    ]);
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function bulkDelete() {
    if (await confirm({ title: "Bulk Delete", message: `Delete ${selectedIds.size} reviews? This cannot be undone.`, variant: "danger" })) {
      await supabase.from("reviews").delete().in("id", Array.from(selectedIds));
      setReviews(reviews.filter(r => !selectedIds.has(r.id)));
      useToastStore.getState().addToast(`${selectedIds.size} reviews deleted`, "success");
      setSelectedIds(new Set());
    }
  }

  async function bulkApprove() {
    await supabase.from("reviews").update({ is_approved: true }).in("id", Array.from(selectedIds));
    setReviews(reviews.map(r => selectedIds.has(r.id) ? { ...r, is_approved: true } : r));
    useToastStore.getState().addToast(`${selectedIds.size} reviews approved`, "success");
    setSelectedIds(new Set());
  }

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const fiveStars = reviews.filter(r => r.rating === 5).length;
  const oneStars = reviews.filter(r => r.rating === 1).length;

  if (loading) return <div className="px-8">Loading reviews...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Reviews</h1>
          <p className="text-[var(--color-outline)]">Manage customer feedback and ratings.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total Reviews</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{reviews.length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800/30 shadow-sm">
          <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Avg Rating</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
            {avgRating} <span className="material-symbols-outlined text-xl">star</span>
          </p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">5-Star Reviews</p>
          <p className="text-3xl font-black text-green-600">{fiveStars}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">1-Star Reviews</p>
          <p className="text-3xl font-black text-red-500">{oneStars}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-4 shadow-sm">
        <div className="flex gap-4 flex-wrap items-center">
          {(["all", "vendor", "rider"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                filter === f ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-subtle)] text-[var(--color-outline)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} Reviews
            </button>
          ))}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--color-outline-variant)] text-sm">search</span>
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search reviews"
              className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter reviews from date"
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter reviews to date"
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
          />
          <div className="flex gap-2 items-center">
            {selectedIds.size === 0 ? (
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 text-xs font-bold text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)] rounded-xl"
              >
                Select All
              </button>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--color-outline-variant)]">{selectedIds.size} selected</span>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 text-xs font-bold text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)] rounded-xl"
                >
                  Deselect All
                </button>
                <button
                  onClick={bulkApprove}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                >
                  Bulk Delete
                </button>
              </>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 flex items-center gap-1 dark:bg-green-900/30 dark:text-green-300"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {filteredReviews.map(review => (
            <div key={review.id} className="p-4 hover:bg-[var(--color-surface-subtle)]">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(review.id)}
                  onChange={() => toggleSelect(review.id)}
                  className="w-4 h-4 mt-2 accent-[var(--color-primary)] flex-shrink-0"
                />
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center font-bold text-[var(--color-on-surface-variant)] flex-shrink-0">
                  {review.profile?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--color-on-surface)]">{review.profile?.full_name || "User"}</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span 
                          key={star} 
                          className={`material-symbols-outlined text-sm ${star <= review.rating ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}`}
                          style={{ fontVariationSettings: star <= review.rating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-[var(--color-outline-variant)]">
                    {review.vendor_id ? "Vendor Review" : "Rider Review"} • {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => toggleStatus(review.id, review.is_approved, 'is_approved')}
                    className={`text-xs px-3 py-1 rounded-full font-bold ${review.is_approved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}
                  >
                    {review.is_approved ? "Approved" : "Pending"}
                  </button>
                  <button 
                    onClick={() => toggleStatus(review.id, review.is_highlighted, 'is_highlighted')}
                    className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${review.is_highlighted ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {review.is_highlighted ? "Highlighted" : "Highlight"}
                  </button>
                  <button 
                    onClick={() => deleteReview(review.id)}
                    className="text-red-500 hover:text-red-700 p-1 flex justify-end"
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