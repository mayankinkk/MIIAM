"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ListSkeleton } from "@/components/Skeleton";
import TechnicianTracker from "@/components/services/TechnicianTracker";

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
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
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
      <div className="bg-surface min-h-screen px-4 pt-20" aria-label="Loading...">
        <ListSkeleton count={4} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
        <h1 className="text-on-surface text-xl font-bold">Booking not found</h1>
        <Link
          href="/app/bookings"
          className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold"
        >
          View Bookings
        </Link>
      </div>
    );
  }

  const hasTechnician = !!booking.technician_name;

  const statusConfig: Record<
    string,
    { icon: string; iconColor: string; title: string; message: string }
  > = {
    in_progress: {
      icon: "pending",
      iconColor: "text-deal",
      title: "In Progress",
      message: "Your service is currently in progress.",
    },
    confirmed: {
      icon: "check_circle",
      iconColor: "text-accent",
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
      iconColor: "text-accent",
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
    <div className="bg-surface min-h-screen pb-24">
      <nav
        className="bg-surface/90 fixed top-0 z-50 flex w-full items-center justify-between px-4 py-3 shadow-[0px_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full transition-all"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-on-surface text-[22px]">
              arrow_back
            </span>
          </button>
          <span className="text-accent text-xl font-extrabold tracking-tighter">MIIAM</span>
        </div>
        <span className="text-on-surface hidden text-sm font-semibold md:block">Track Service</span>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-20">
        <div className="mb-6">
          <h1 className="text-on-surface text-2xl font-extrabold tracking-tight">Track Service</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {booking.sub_service || booking.service_type}
          </p>
        </div>

        {/* Live technician tracking (map + ETA + contact) */}
        {(hasTechnician || ["confirmed", "in_progress", "pending"].includes(booking.status)) && (
          <TechnicianTracker
            booking={{
              id: booking.id,
              status: booking.status,
              address: booking.address || null,
              technician_name: booking.technician_name || null,
              technician_phone: booking.technician_phone || null,
              scheduled_date: booking.scheduled_date || null,
              scheduled_time: booking.scheduled_time || null,
              amount: booking.amount || null,
              sub_service: booking.sub_service || null,
              service_type: booking.service_type || null,
              lat: booking.lat || null,
              lng: booking.lng || null,
            }}
          />
        )}

        {/* Fallback status card for non-active states without tracker */}
        {!hasTechnician &&
          !["confirmed", "in_progress", "pending"].includes(booking.status) &&
          activeConfig && (
            <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-6 text-center">
              <span
                className={`material-symbols-outlined text-5xl ${activeConfig.iconColor} mb-3 block`}
              >
                {activeConfig.icon}
              </span>
              <h2 className="text-on-surface mb-2 text-lg font-bold">{activeConfig.title}</h2>
              <p className="text-on-surface-variant text-sm">{activeConfig.message}</p>
            </div>
          )}

        {/* Booking Details */}
        <div className="bg-surface-container-lowest border-outline-variant/10 mt-6 rounded-2xl border p-4">
          <h3 className="text-on-surface mb-3 text-sm font-bold">Booking Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Service</span>
              <span className="text-on-surface font-bold">
                {booking.sub_service || booking.service_type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Date</span>
              <span className="text-on-surface font-bold">
                {booking.scheduled_date
                  ? new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Time</span>
              <span className="text-on-surface font-bold">{booking.scheduled_time || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Amount</span>
              <span className="text-on-surface font-bold">₹{booking.amount || 0}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
