"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import { SERVICE_TIME_SLOTS } from "@/lib/data/services";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ServiceBooking {
  id: string;
  service_type: string;
  sub_service: string | null;
  user_name: string;
  user_phone: string;
  address: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  amount: number;
  notes: string | null;
  created_at: string;
  technician_name: string | null;
  technician_phone: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: "hourglass_empty",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-on-surface",
    bg: "bg-primary/40",
    icon: "check_circle",
  },
  in_progress: { label: "In Progress", color: "text-deal", bg: "bg-deal/10", icon: "engineering" },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-100", icon: "task_alt" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100", icon: "cancel" },
};

const SERVICE_ICONS: Record<string, string> = {
  ac: "ac_unit",
  plumbing: "plumbing",
  electrical: "electrical_services",
  cleaning: "cleaning_services",
  appliance: "home_repair_service",
  pest: "bug_report",
  beauty: "spa",
};

export default function BookingsPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const supabase = useMemo(() => createClient(), []);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [rescheduleBooking, setRescheduleBooking] = useState<ServiceBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<ServiceBooking | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set());
  const [rebookBooking, setRebookBooking] = useState<ServiceBooking | null>(null);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState("");
  const [rebooking, setRebooking] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (rescheduleBooking) setRescheduleBooking(null);
        else if (ratingBooking) setRatingBooking(null);
        else if (rebookBooking) setRebookBooking(null);
      }
    };
    if (rescheduleBooking || ratingBooking || rebookBooking) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [rescheduleBooking, ratingBooking, rebookBooking]);

  useEffect(() => {
    async function loadBookings() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("service_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setBookings(data || []);
      } catch (err) {
        logger.error({ err }, "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [supabase]);

  const upcoming = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status)
  );
  const past = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));
  const displayBookings = activeTab === "upcoming" ? upcoming : past;

  async function handleCancel(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !["pending", "confirmed"].includes(booking.status)) {
      addToast("This booking cannot be cancelled", "error");
      return;
    }
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      addToast("Booking cancelled", "success");
    } catch {
      addToast("Failed to cancel booking", "error");
    }
  }

  async function handleReschedule() {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    if (!["pending", "confirmed"].includes(rescheduleBooking.status)) {
      addToast("This booking cannot be rescheduled", "error");
      setRescheduleBooking(null);
      return;
    }
    setRescheduling(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ scheduled_date: rescheduleDate, scheduled_time: rescheduleTime })
        .eq("id", rescheduleBooking.id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rescheduleBooking.id
            ? { ...b, scheduled_date: rescheduleDate, scheduled_time: rescheduleTime }
            : b
        )
      );
      setRescheduleBooking(null);
      setRescheduleDate("");
      setRescheduleTime("");
      addToast("Booking rescheduled", "success");
    } catch {
      addToast("Failed to reschedule", "error");
    } finally {
      setRescheduling(false);
    }
  }

  const rescheduleDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          value: d.toISOString().split("T")[0],
          label:
            i === 0
              ? "Today"
              : i === 1
                ? "Tomorrow"
                : d.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }),
        };
      }),
    []
  );

  async function handleSubmitRating() {
    if (!ratingBooking || rating === 0) return;
    setSubmittingRating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
        type: "service",
        order_id: ratingBooking.id,
      });
      if (error) throw error;
      setRatedBookings((prev) => new Set(prev).add(ratingBooking.id));
      setRatingBooking(null);
      setRating(0);
      setReviewText("");
      addToast("Thank you for your review!", "success");
    } catch {
      addToast("Failed to submit review", "error");
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleRebook() {
    if (!rebookBooking || !rebookDate || !rebookTime) return;
    setRebooking(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        addToast("Please log in", "error");
        return;
      }
      const { error } = await supabase.from("service_bookings").insert({
        service_type: rebookBooking.service_type,
        sub_service: rebookBooking.sub_service,
        user_id: user.id,
        user_name: rebookBooking.user_name,
        user_phone: rebookBooking.user_phone,
        address: rebookBooking.address,
        scheduled_date: rebookDate,
        scheduled_time: rebookTime,
        amount: rebookBooking.amount,
        status: "pending",
      });
      if (error) throw error;
      setRebookBooking(null);
      setRebookDate("");
      setRebookTime("");
      addToast("Booking confirmed!", "success");
      const { data: updated } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (updated) setBookings(updated);
    } catch {
      addToast("Failed to create booking", "error");
    } finally {
      setRebooking(false);
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-24 dark:bg-[var(--color-surface)]">
      <nav
        className="bg-surface/90 fixed top-0 z-50 flex w-full items-center justify-between px-4 py-3 shadow-[0px_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:bg-[var(--color-surface)]/90"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/app/profile"
            className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full transition-all"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-on-surface text-[22px]">
              arrow_back
            </span>
          </Link>
          <span className="text-accent text-xl font-extrabold tracking-tighter">MIIAM</span>
        </div>
        <span className="text-on-surface hidden font-semibold md:block">{t.profile.bookings}</span>
      </nav>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: t.profile.bookings }]} />

      <main className="mx-auto max-w-2xl px-4 pt-20">
        <section className="mb-6">
          <h1 className="text-on-surface text-2xl font-extrabold tracking-tight">
            {t.profile.bookings}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">{t.profile.serviceAppointments}</p>
        </section>

        {/* Tabs */}
        <div className="bg-surface-container mb-6 flex gap-2 rounded-xl p-1 dark:bg-[var(--color-surface-container)]">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "upcoming" ? "bg-primary text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              activeTab === "past" ? "bg-primary text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-outline-variant/40 mb-4 block text-6xl">
              calendar_month
            </span>
            <h2 className="text-on-surface mb-2 text-xl font-bold">No {activeTab} bookings</h2>
            <p className="text-on-surface-variant mb-6 text-sm">
              {activeTab === "upcoming"
                ? "Book a service to get started"
                : "Your completed bookings will appear here"}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/app/services"
                className="bg-primary text-on-primary inline-block rounded-xl px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              >
                Browse Services
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map((booking) => {
              const st = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const serviceIcon = SERVICE_ICONS[booking.service_type] || "home_repair_service";
              const dateStr = booking.scheduled_date
                ? new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : "—";

              return (
                <div
                  key={booking.id}
                  className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-4 shadow-sm dark:bg-[var(--color-surface-container-lowest)]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
                      <span className="material-symbols-outlined text-accent text-xl">
                        {serviceIcon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-on-surface text-sm font-bold">
                            {booking.sub_service || booking.service_type}
                          </h3>
                          <p className="text-on-surface-variant mt-0.5 text-xs">
                            ID: {booking.id.slice(0, 8)}
                          </p>
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.color} ${st.bg}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{st.icon}</span>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <div className="bg-surface rounded-lg p-2 text-center dark:bg-[var(--color-surface)]">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">
                        calendar_today
                      </span>
                      <p className="text-on-surface mt-1 text-xs font-bold">{dateStr}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-2 text-center dark:bg-[var(--color-surface)]">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">
                        schedule
                      </span>
                      <p className="text-on-surface mt-1 text-xs font-bold">
                        {booking.scheduled_time || "—"}
                      </p>
                    </div>
                    <div className="bg-surface rounded-lg p-2 text-center dark:bg-[var(--color-surface)]">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">
                        payments
                      </span>
                      <p className="text-on-surface mt-1 text-xs font-bold">
                        ₹{booking.amount || 0}
                      </p>
                    </div>
                  </div>

                  {booking.address && (
                    <div className="text-on-surface-variant bg-surface mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs dark:bg-[var(--color-surface)]">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}

                  {booking.technician_name &&
                    ["pending", "confirmed", "in_progress"].includes(booking.status) && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                        <span
                          className="material-symbols-outlined text-sm text-green-600 dark:text-green-400"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          person
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-green-700 dark:text-green-400">
                            {booking.technician_name}
                          </p>
                          {booking.technician_phone && (
                            <p className="text-[10px] text-green-600 dark:text-green-400/70">
                              {booking.technician_phone}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-900/40 dark:text-green-400">
                          Assigned
                        </span>
                      </div>
                    )}

                  {booking.status === "in_progress" && !booking.technician_name && (
                    <div className="mb-3 flex gap-2">
                      <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 py-2 text-center text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[14px]">person_off</span>
                        Technician Not Assigned
                      </div>
                    </div>
                  )}

                  {(booking.status === "confirmed" || booking.status === "pending") && (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="bg-surface-container text-on-surface flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          event
                        </span>
                        Scheduled {dateStr}{" "}
                        {booking.scheduled_time ? `· ${booking.scheduled_time}` : ""}
                      </div>
                    </div>
                  )}

                  {(booking.status === "confirmed" || booking.status === "pending") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRescheduleBooking(booking);
                          setRescheduleDate(booking.scheduled_date || "");
                          setRescheduleTime(booking.scheduled_time || "");
                        }}
                        className="bg-primary/10 text-accent hover:bg-primary hover:text-on-primary/20 flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-center text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                        Reschedule
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            await confirm({
                              title: "Cancel Booking",
                              message: "Cancel this booking?",
                              variant: "danger",
                            })
                          ) {
                            handleCancel(booking.id);
                          }
                        }}
                        className="border-outline-variant text-on-surface-variant hover:bg-surface flex-1 rounded-lg border py-2 text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {booking.status === "completed" && !ratedBookings.has(booking.id) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRatingBooking(booking);
                          setRating(0);
                          setReviewText("");
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-100 py-2 text-center text-xs font-bold text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
                      >
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        Rate Service
                      </button>
                      <button
                        onClick={() => {
                          setRebookBooking(booking);
                          setRebookDate("");
                          setRebookTime("");
                        }}
                        className="bg-primary/10 text-accent hover:bg-primary hover:text-on-primary/20 flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-center text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">replay</span>
                        Book Again
                      </button>
                    </div>
                  )}

                  {booking.status === "completed" && ratedBookings.has(booking.id) && (
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        Reviewed
                      </div>
                      <button
                        onClick={() => {
                          setRebookBooking(booking);
                          setRebookDate("");
                          setRebookTime("");
                        }}
                        className="bg-primary/10 text-accent hover:bg-primary hover:text-on-primary/20 flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-center text-xs font-bold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">replay</span>
                        Book Again
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
        >
          <div className="bg-surface-container-lowest animate-slide-reveal w-full max-w-lg rounded-t-3xl p-6 pb-10 shadow-2xl dark:bg-[var(--color-surface-container-lowest)]">
            <div className="bg-surface-container-high mx-auto mb-5 h-1.5 w-12 rounded-full dark:bg-[var(--color-surface-container-high)]" />
            <h2 id="reschedule-modal-title" className="text-on-surface mb-1 text-lg font-bold">
              Reschedule Booking
            </h2>
            <p className="text-on-surface-variant mb-5 text-sm">
              {rescheduleBooking.sub_service || rescheduleBooking.service_type}
            </p>

            <p className="text-on-surface mb-2 text-sm font-bold">Select Date</p>
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
              {rescheduleDates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRescheduleDate(d.value)}
                  className={`flex-shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${
                    rescheduleDate === d.value
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="text-on-surface mb-2 text-sm font-bold">Select Time</p>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setRescheduleTime(slot)}
                  className={`rounded-xl border-2 p-3 text-left text-xs font-bold transition-all ${
                    rescheduleTime === slot
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRescheduleBooking(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
                className="bg-surface-container text-on-surface-variant flex-1 rounded-xl py-3 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                className="bg-primary text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-50"
              >
                {rescheduling ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {rescheduling ? "Rescheduling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rating-modal-title"
        >
          <div className="bg-surface-container-lowest animate-slide-reveal w-full max-w-lg rounded-t-3xl p-6 pb-10 shadow-2xl dark:bg-[var(--color-surface-container-lowest)]">
            <div className="bg-surface-container-high mx-auto mb-5 h-1.5 w-12 rounded-full dark:bg-[var(--color-surface-container-high)]" />
            <h2 id="rating-modal-title" className="text-on-surface mb-1 text-lg font-bold">
              Rate Your Experience
            </h2>
            <p className="text-on-surface-variant mb-5 text-sm">
              {ratingBooking.sub_service || ratingBooking.service_type}
            </p>

            <div className="mb-5 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  className="p-2"
                >
                  <span
                    className="material-symbols-outlined text-5xl transition-all"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color: star <= (hoverRating || rating) ? "#ffd700" : "#e5e7eb",
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-on-surface-variant mb-4 text-center text-sm">
                {rating === 1
                  ? "Poor"
                  : rating === 2
                    ? "Fair"
                    : rating === 3
                      ? "Good"
                      : rating === 4
                        ? "Very Good"
                        : "Excellent"}
              </p>
            )}

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="border-outline focus:border-primary mb-5 w-full resize-none rounded-xl border-2 p-3 text-sm focus:outline-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRatingBooking(null);
                  setRating(0);
                  setReviewText("");
                }}
                className="bg-surface-container text-on-surface-variant flex-1 rounded-xl py-3 text-sm font-bold"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submittingRating}
                className="bg-primary text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-50"
              >
                {submittingRating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {submittingRating ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rebook Modal */}
      {rebookBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rebook-modal-title"
        >
          <div className="bg-surface-container-lowest animate-slide-reveal w-full max-w-lg rounded-t-3xl p-6 pb-10 shadow-2xl dark:bg-[var(--color-surface-container-lowest)]">
            <div className="bg-surface-container-high mx-auto mb-5 h-1.5 w-12 rounded-full dark:bg-[var(--color-surface-container-high)]" />
            <h2 id="rebook-modal-title" className="text-on-surface mb-1 text-lg font-bold">
              Book Again
            </h2>
            <p className="text-on-surface-variant mb-5 text-sm">
              {rebookBooking.sub_service || rebookBooking.service_type} — ₹{rebookBooking.amount}
            </p>

            <p className="text-on-surface mb-2 text-sm font-bold">Select Date</p>
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
              {rescheduleDates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRebookDate(d.value)}
                  className={`flex-shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${
                    rebookDate === d.value
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="text-on-surface mb-2 text-sm font-bold">Select Time</p>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setRebookTime(slot)}
                  className={`rounded-xl border-2 p-3 text-left text-xs font-bold transition-all ${
                    rebookTime === slot
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRebookBooking(null);
                  setRebookDate("");
                  setRebookTime("");
                }}
                className="bg-surface-container text-on-surface-variant flex-1 rounded-xl py-3 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRebook}
                disabled={!rebookDate || !rebookTime || rebooking}
                className="bg-primary text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-50"
              >
                {rebooking ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {rebooking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
