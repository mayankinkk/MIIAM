"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import { SERVICE_TIME_SLOTS } from "@/lib/data/services";
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
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100", icon: "hourglass_empty" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-100", icon: "check_circle" },
  in_progress: { label: "In Progress", color: "text-indigo-700", bg: "bg-indigo-100", icon: "engineering" },
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("service_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setBookings(data || []);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [supabase]);

  const upcoming = bookings.filter(b => ["pending", "confirmed", "in_progress"].includes(b.status));
  const past = bookings.filter(b => ["completed", "cancelled"].includes(b.status));
  const displayBookings = activeTab === "upcoming" ? upcoming : past;

  async function handleCancel(bookingId: string) {
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      addToast("Booking cancelled", "success");
    } catch {
      addToast("Failed to cancel booking", "error");
    }
  }

  async function handleReschedule() {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ scheduled_date: rescheduleDate, scheduled_time: rescheduleTime })
        .eq("id", rescheduleBooking.id);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === rescheduleBooking.id ? { ...b, scheduled_date: rescheduleDate, scheduled_time: rescheduleTime } : b));
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

  const rescheduleDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        value: d.toISOString().split("T")[0],
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      };
    }), []
  );

  async function handleSubmitRating() {
    if (!ratingBooking || rating === 0) return;
    setSubmittingRating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
        type: "service",
        order_id: ratingBooking.id,
      });
      if (error) throw error;
      setRatedBookings(prev => new Set(prev).add(ratingBooking.id));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { addToast("Please log in", "error"); return; }
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
        status: "confirmed",
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
    <div className="min-h-screen bg-surface pb-24">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all" aria-label="Back">
            <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
          </Link>
          <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold hidden md:block">{t.profile.bookings}</span>
      </nav>

      <Breadcrumbs items={[{ label: "Home", href: "/app/explore" }, { label: t.profile.bookings }]} />

      <main className="pt-20 max-w-2xl mx-auto px-4">
        <section className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">{t.profile.bookings}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{t.profile.serviceAppointments}</p>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 bg-surface-container rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "upcoming" ? "bg-primary text-white" : "text-on-surface-variant"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "past" ? "bg-primary text-white" : "text-on-surface-variant"
            }`}
          >
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4 block">calendar_month</span>
            <h2 className="text-xl font-bold text-on-surface mb-2">No {activeTab} bookings</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              {activeTab === "upcoming" ? "Book a service to get started" : "Your completed bookings will appear here"}
            </p>
            {activeTab === "upcoming" && (
              <Link href="/app/services" className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all inline-block">
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
                ? new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                : "—";

              return (
                <div key={booking.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-xl">{serviceIcon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-on-surface text-sm">{booking.sub_service || booking.service_type}</h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">ID: {booking.id.slice(0, 8)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${st.color} ${st.bg}`}>
                          <span className="material-symbols-outlined text-[12px]">{st.icon}</span>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-surface rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
                      <p className="text-xs font-bold text-on-surface mt-1">{dateStr}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">schedule</span>
                      <p className="text-xs font-bold text-on-surface mt-1">{booking.scheduled_time || "—"}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-2 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">payments</span>
                      <p className="text-xs font-bold text-on-surface mt-1">₹{booking.amount || 0}</p>
                    </div>
                  </div>

                  {booking.address && (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-3 bg-surface rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}

                  {booking.status === "in_progress" && (
                    <div className="flex gap-2">
                      {booking.technician_name ? (
                        <div className="flex-1 py-2 bg-green-50 rounded-lg text-xs font-bold text-green-700 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {booking.technician_name}
                          {booking.technician_phone && <span className="text-green-600 font-normal">· {booking.technician_phone}</span>}
                        </div>
                      ) : (
                        <div className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person_off</span>
                          Technician Not Assigned
                        </div>
                      )}
                    </div>
                  )}

                  {(booking.status === "confirmed" || booking.status === "pending") && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                        Scheduled {dateStr} {booking.scheduled_time ? `· ${booking.scheduled_time}` : ""}
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
                        className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold text-center hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                        Reschedule
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirm({ title: "Cancel Booking", message: "Cancel this booking?", variant: "danger" })) {
                            handleCancel(booking.id);
                          }
                        }}
                        className="flex-1 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {booking.status === "completed" && !ratedBookings.has(booking.id) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setRatingBooking(booking); setRating(0); setReviewText(""); }}
                        className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold text-center hover:bg-amber-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        Rate Service
                      </button>
                      <button
                        onClick={() => { setRebookBooking(booking); setRebookDate(""); setRebookTime(""); }}
                        className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold text-center hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">replay</span>
                        Book Again
                      </button>
                    </div>
                  )}

                  {booking.status === "completed" && ratedBookings.has(booking.id) && (
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Reviewed
                      </div>
                      <button
                        onClick={() => { setRebookBooking(booking); setRebookDate(""); setRebookTime(""); }}
                        className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold text-center hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="reschedule-modal-title">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-reveal">
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" />
            <h2 id="reschedule-modal-title" className="text-lg font-bold text-on-surface mb-1">Reschedule Booking</h2>
            <p className="text-sm text-on-surface-variant mb-5">{rescheduleBooking.sub_service || rescheduleBooking.service_type}</p>

            <p className="font-bold text-on-surface text-sm mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {rescheduleDates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRescheduleDate(d.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    rescheduleDate === d.value
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="font-bold text-on-surface text-sm mb-2">Select Time</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setRescheduleTime(slot)}
                  className={`p-3 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                    rescheduleTime === slot
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRescheduleBooking(null); setRescheduleDate(""); setRescheduleTime(""); }}
                className="flex-1 py-3 bg-surface-container rounded-xl font-bold text-sm text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rescheduling ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {rescheduling ? "Rescheduling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-reveal">
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" />
            <h2 id="rating-modal-title" className="text-lg font-bold text-on-surface mb-1">Rate Your Experience</h2>
            <p className="text-sm text-on-surface-variant mb-5">{ratingBooking.sub_service || ratingBooking.service_type}</p>

            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
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
              <p className="text-center text-sm text-on-surface-variant mb-4">
                {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent"}
              </p>
            )}

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="w-full p-3 border-2 border-outline rounded-xl text-sm focus:border-primary focus:outline-none resize-none mb-5"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setRatingBooking(null); setRating(0); setReviewText(""); }}
                className="flex-1 py-3 bg-surface-container rounded-xl font-bold text-sm text-on-surface-variant"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submittingRating}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingRating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {submittingRating ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rebook Modal */}
      {rebookBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="rebook-modal-title">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-reveal">
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" />
            <h2 id="rebook-modal-title" className="text-lg font-bold text-on-surface mb-1">Book Again</h2>
            <p className="text-sm text-on-surface-variant mb-5">{rebookBooking.sub_service || rebookBooking.service_type} — ₹{rebookBooking.amount}</p>

            <p className="font-bold text-on-surface text-sm mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {rescheduleDates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRebookDate(d.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    rebookDate === d.value
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="font-bold text-on-surface text-sm mb-2">Select Time</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setRebookTime(slot)}
                  className={`p-3 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                    rebookTime === slot
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRebookBooking(null); setRebookDate(""); setRebookTime(""); }}
                className="flex-1 py-3 bg-surface-container rounded-xl font-bold text-sm text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                onClick={handleRebook}
                disabled={!rebookDate || !rebookTime || rebooking}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rebooking ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {rebooking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
