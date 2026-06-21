"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ListSkeleton } from "@/components/Skeleton";

interface ServiceBooking {
  id: string;
  status: string;
  technician_name?: string | null;
  technician_phone?: string | null;
  sub_service?: string | null;
  service_type?: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  amount?: number | null;
}

export default function BookingTrackPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
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
      <div className="min-h-screen bg-surface px-4 pt-20" aria-label="Loading...">
        <ListSkeleton count={4} />
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

  const hasTechnician = !!booking.technician_name;

  const statusConfig: Record<string, { icon: string; iconColor: string; title: string; message: string }> = {
    in_progress: {
      icon: "pending",
      iconColor: "text-blue-500",
      title: "In Progress",
      message: "Your service is currently in progress.",
    },
    confirmed: {
      icon: "check_circle",
      iconColor: "text-blue-500",
      title: "Booking Confirmed",
      message: "Your booking is confirmed. A technician will be assigned soon.",
    },
    pending: {
      icon: "hourglass_empty",
      iconColor: "text-amber-500",
      title: "Awaiting Confirmation",
      message: "Your booking is pending confirmation.",
    },
    completed: {
      icon: "task_alt",
      iconColor: "text-green-500",
      title: "Service Completed",
      message: "Your service has been completed.",
    },
    cancelled: {
      icon: "cancel",
      iconColor: "text-red-500",
      title: "Booking Cancelled",
      message: "This booking has been cancelled.",
    },
  };

  const activeConfig = statusConfig[booking.status];

  return (
    <div className="min-h-screen bg-surface pb-24">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all" aria-label="Back">
            <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
          </button>
          <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <span className="text-on-surface font-semibold text-sm hidden md:block">Track Service</span>
      </nav>

      <main className="pt-20 max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">Track Service</h1>
          <p className="text-on-surface-variant text-sm mt-1">{booking.sub_service || booking.service_type}</p>
        </div>

        {/* Technician Card or Status Card */}
        {hasTechnician ? (
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <h2 className="text-sm font-bold text-green-600">Technician Assigned</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface text-base">{booking.technician_name}</p>
                {booking.technician_phone && (
                  <p className="text-sm text-on-surface-variant mt-0.5">{booking.technician_phone}</p>
                )}
              </div>
              {booking.technician_phone && (
                <a
                  href={`tel:${booking.technician_phone}`}
                  className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">call</span>
                </a>
              )}
            </div>
          </div>
        ) : activeConfig ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
            <span className={`material-symbols-outlined text-5xl ${activeConfig.iconColor} mb-3 block`}>{activeConfig.icon}</span>
            <h2 className="text-lg font-bold text-on-surface mb-2">{activeConfig.title}</h2>
            <p className="text-on-surface-variant text-sm">{activeConfig.message}</p>
          </div>
        ) : null}

        {/* Booking Details */}
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
