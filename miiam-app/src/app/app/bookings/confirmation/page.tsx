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
    if (!bookingId) { setLoading(false); return; }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">event_available</span>
        <h1 className="text-xl font-black text-gray-900 mb-1">No Booking Found</h1>
        <p className="text-sm text-gray-400 mb-4">Your booking details will appear here.</p>
        <Link href="/app/bookings" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">View All Bookings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      {/* Success Animation */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce-in">
          <span className="material-symbols-outlined text-blue-600 text-5xl">check_circle</span>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white text-lg">celebration</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-1">Booking Confirmed!</h1>
      <p className="text-sm text-gray-400 mb-6">We&apos;ll notify you when a technician is assigned</p>

      {/* Booking Card */}
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Booking ID</span>
          <span className="text-sm font-bold text-gray-900">#{booking.id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-lg">home_repair_service</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{booking.sub_service || booking.service_type}</p>
            <p className="text-xs text-gray-400 capitalize">{booking.service_type}</p>
          </div>
        </div>

        {booking.scheduled_date && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-sm">calendar_today</span>
              <span className="text-xs font-bold text-gray-600">Date</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {new Date(booking.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        )}

        {booking.scheduled_time && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-sm">schedule</span>
              <span className="text-xs font-bold text-gray-600">Time</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{booking.scheduled_time}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-sm">payments</span>
            <span className="text-xs font-bold text-gray-600">Amount</span>
          </div>
          <span className="text-sm font-bold text-gray-900">₹{booking.amount || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
            <span className="text-xs font-bold text-gray-600">Status</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">{booking.status}</span>
        </div>

        {booking.technician_name && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-green-600 text-lg">person</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{booking.technician_name}</p>
                {booking.technician_phone && (
                  <a href={`tel:${booking.technician_phone}`} className="text-xs text-blue-600 font-bold">{booking.technician_phone}</a>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <Link href="/app/bookings" className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm text-center hover:bg-gray-200 transition-all">
          View Bookings
        </Link>
        <Link href="/app/services" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm text-center hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
          Book Another
        </Link>
      </div>

      <Link href="/app/home" className="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600">
        Back to Home
      </Link>
    </div>
  );
}
