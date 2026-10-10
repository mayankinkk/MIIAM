"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  service_type: string;
  sub_service: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  amount: number | null;
  status: string;
  address: string | null;
  technician_name: string | null;
  technician_phone: string | null;
  created_at: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const supabase = useMemo(() => createClient(), []);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    async function fetchBooking() {
      const { data } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setLoading(false);
    }
    fetchBooking();
  }, [bookingId, supabase]);

  if (loading) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="border-outline/30 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-outline mb-4 text-6xl">
          event_available
        </span>
        <h1 className="text-on-surface mb-1 text-xl font-black">No Booking Found</h1>
        <p className="text-on-surface-variant mb-4 text-sm">
          Your booking details will appear here.
        </p>
        <Link
          href="/app/bookings"
          className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold"
        >
          View All Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface flex min-h-screen flex-col items-center px-4 py-12">
      {/* Success Animation */}
      <div className="relative mb-6">
        <div className="bg-accent/15 dark:bg-accent/20 animate-bounce-in flex h-24 w-24 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-accent text-5xl">check_circle</span>
        </div>
        <div className="bg-accent absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-lg">
          <span className="material-symbols-outlined text-lg text-white">celebration</span>
        </div>
      </div>

      <h1 className="text-on-surface mb-1 text-2xl font-black">Booking Confirmed!</h1>
      <p className="text-on-surface-variant mb-6 text-sm">
        We&apos;ll notify you when a technician is assigned
      </p>

      {/* Booking Card */}
      <div className="bg-surface-container-lowest border-outline-variant/20 w-full max-w-sm space-y-4 rounded-2xl border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant text-[10px] font-bold tracking-wider uppercase">
            Booking ID
          </span>
          <span className="text-on-surface text-sm font-bold">
            #{booking.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="bg-outline-variant/20 h-px" />

        <div className="flex items-center gap-3">
          <div className="bg-primary/20 dark:bg-primary/30 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-on-surface dark:text-primary text-lg">
              home_repair_service
            </span>
          </div>
          <div>
            <p className="text-on-surface text-sm font-bold">
              {booking.sub_service || booking.service_type}
            </p>
            <p className="text-on-surface-variant text-xs capitalize">{booking.service_type}</p>
          </div>
        </div>

        {booking.scheduled_date && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                calendar_today
              </span>
              <span className="text-on-surface-variant text-xs font-bold">Date</span>
            </div>
            <span className="text-on-surface text-sm font-bold">
              {new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        )}

        {booking.scheduled_time && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                schedule
              </span>
              <span className="text-on-surface-variant text-xs font-bold">Time</span>
            </div>
            <span className="text-on-surface text-sm font-bold">{booking.scheduled_time}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">
              payments
            </span>
            <span className="text-on-surface-variant text-xs font-bold">Amount</span>
          </div>
          <span className="text-on-surface text-sm font-bold">₹{booking.amount || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">info</span>
            <span className="text-on-surface-variant text-xs font-bold">Status</span>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 capitalize dark:bg-amber-900/30 dark:text-amber-400">
            {booking.status}
          </span>
        </div>

        {booking.technician_name && (
          <>
            <div className="bg-outline-variant/20 h-px" />
            <div className="flex items-center gap-3">
              <div className="bg-accent/15 dark:bg-accent/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-accent text-lg">person</span>
              </div>
              <div>
                <p className="text-on-surface text-sm font-bold">{booking.technician_name}</p>
                {booking.technician_phone && (
                  <a
                    href={`tel:${booking.technician_phone}`}
                    className="text-accent text-xs font-bold"
                  >
                    {booking.technician_phone}
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full max-w-sm gap-3">
        <Link
          href="/app/bookings"
          className="bg-surface-container-low text-on-surface hover:bg-surface-container-high flex-1 rounded-xl py-3 text-center text-sm font-bold transition-all"
        >
          View Bookings
        </Link>
        <Link
          href="/app/services"
          className="bg-primary text-on-primary hover:bg-primary-hover shadow-primary/20 flex-1 rounded-xl py-3 text-center text-sm font-bold shadow-md transition-all"
        >
          Book Another
        </Link>
      </div>

      <Link
        href="/app/home"
        className="text-on-surface-variant hover:text-on-surface mt-4 text-sm font-bold"
      >
        Back to Home
      </Link>
    </div>
  );
}
