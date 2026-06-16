"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TechnicianTracker from "@/components/services/TechnicianTracker";

export default function BookingTrackPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setLoading(false);
    }
    load();
  }, [bookingId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
        <h1 className="text-xl font-bold text-on-surface">Booking not found</h1>
        <Link href="/app/bookings" className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">
          View Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/app/bookings" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all" aria-label="Back">
            <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
          </Link>
          <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold text-sm hidden md:block">Track Service</span>
      </nav>

      <main className="pt-20 max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">Track Technician</h1>
          <p className="text-on-surface-variant text-sm mt-1">{booking.sub_service || booking.service_type}</p>
        </div>

        {booking.status === "in_progress" ? (
          <TechnicianTracker orderId={booking.id} />
        ) : booking.status === "confirmed" ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-blue-500 mb-3 block">engineering</span>
            <h2 className="text-lg font-bold text-on-surface mb-2">Technician not yet dispatched</h2>
            <p className="text-on-surface-variant text-sm">Your booking is confirmed. A technician will be assigned and you can track them once they are on the way.</p>
          </div>
        ) : booking.status === "pending" ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-amber-500 mb-3 block">hourglass_empty</span>
            <h2 className="text-lg font-bold text-on-surface mb-2">Awaiting confirmation</h2>
            <p className="text-on-surface-variant text-sm">Your booking is pending confirmation. You&apos;ll be able to track once a technician is assigned.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-5xl text-outline-variant/40 mb-3 block">info</span>
            <h2 className="text-lg font-bold text-on-surface mb-2">Tracking not available</h2>
            <p className="text-on-surface-variant text-sm">Tracking is only available for active service bookings.</p>
          </div>
        )}

        {/* Booking details */}
        <div className="mt-6 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10">
          <h3 className="font-bold text-on-surface text-sm mb-3">Booking Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Service</span>
              <span className="font-bold text-on-surface">{booking.sub_service || booking.service_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Date</span>
              <span className="font-bold text-on-surface">
                {booking.scheduled_date ? new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Time</span>
              <span className="font-bold text-on-surface">{booking.scheduled_time || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Amount</span>
              <span className="font-bold text-on-surface">₹{booking.amount || 0}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
