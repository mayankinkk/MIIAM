"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
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
                      <Link
                        href={`/app/bookings/${booking.id}/track`}
                        className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold text-center hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        Track Technician
                      </Link>
                    </div>
                  )}

                  {booking.status === "confirmed" && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (window.confirm("Cancel this booking?")) {
                            handleCancel(booking.id);
                          }
                        }}
                        className="flex-1 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
