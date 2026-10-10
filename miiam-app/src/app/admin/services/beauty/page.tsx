"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

const beautyCategories = [
  { id: "salon", label: "Salon at Home", icon: "content_cut", color: "pink" },
  { id: "spa", label: "Spa & Massage", icon: "spa", color: "purple" },
  { id: "nails", label: "Nail Care", icon: "brush", color: "rose" },
  { id: "makeup", label: "Makeup", icon: "face", color: "amber" },
  { id: "threading", label: "Threading", icon: "clear", color: "orange" },
  { id: "facial", label: "Facials", icon: "auto_awesome", color: "green" },
];

export default function BeautyServicesAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "professionals">("overview");
  interface Booking {
    id: string;
    service_type: string;
    service_sub_type?: string;
    status: string;
    amount: number;
    user_name: string;
    user_phone: string;
    scheduled_date: string;
    scheduled_time: string;
    created_at: string;
  }

  interface Provider {
    id: string;
    name?: string;
    full_name?: string;
    status?: string;
    phone?: string;
    specialties?: string[];
    created_at: string;
  }

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bookingsRes, providersRes] = await Promise.all([
        supabase
          .from("service_bookings")
          .select("*")
          .eq("service_type", "beauty")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("service_providers")
          .select("*")
          .eq("service_type", "beauty")
          .order("created_at", { ascending: false }),
      ]);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (providersRes.data) setProviders(providersRes.data);
    } catch (e) {
      logger.error(
        { err: e instanceof Error ? e : new Error(String(e)) },
        "Failed to load beauty data"
      );
    }
    setLoading(false);
  }

  const totalRevenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.amount || 0), 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.scheduled_date === todayStr).length;

  const categoryStats = beautyCategories.map((cat) => {
    const catBookings = bookings.filter(
      (b) => b.service_sub_type === cat.id || b.service_type === cat.id
    );
    const catRevenue = catBookings
      .filter((b) => b.status === "completed")
      .reduce((s, b) => s + (b.amount || 0), 0);
    return { ...cat, bookings: catBookings.length, revenue: catRevenue };
  });

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Link href="/admin/services" className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-black">Beauty & Wellness</h1>
            </div>
            <p className="text-white/80">Manage salon, spa, nails & makeup services</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-white/80">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="-mt-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
              <span className="material-symbols-outlined text-pink-600">spa</span>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--color-on-surface)]">
                {bookings.length}
              </div>
              <div className="text-xs text-[var(--color-outline)]">Total Bookings</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-accent">event</span>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--color-on-surface)]">
                {todaysBookings}
              </div>
              <div className="text-xs text-[var(--color-outline)]">Today's Bookings</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <span className="material-symbols-outlined text-amber-600">people</span>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--color-on-surface)]">
                {providers.length}
              </div>
              <div className="text-xs text-[var(--color-outline)]">Active Pros</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
            <div>
              <div className="text-2xl font-black text-[var(--color-on-surface)]">
                {bookings.filter((b) => b.status === "completed").length}
              </div>
              <div className="text-xs text-[var(--color-outline)]">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-2 border-b border-[var(--color-border-subtle)]">
          {["overview", "bookings", "professionals"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "overview" | "bookings" | "professionals")}
              className={`px-4 py-3 text-sm font-bold capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-pink-600 text-pink-600"
                  : "text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-[var(--color-outline)]">Loading...</div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
                  <h2 className="mb-4 text-lg font-bold text-[var(--color-on-surface)]">
                    Categories
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryStats.map((cat) => (
                      <div
                        key={cat.id}
                        className="cursor-pointer rounded-xl border border-[var(--color-border-subtle)] p-4 transition-colors hover:border-pink-200 hover:bg-pink-50/30"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 bg-${cat.color}-100 flex items-center justify-center rounded-xl`}
                            >
                              <span className={`material-symbols-outlined text-${cat.color}-600`}>
                                {cat.icon}
                              </span>
                            </div>
                            <span className="font-bold text-[var(--color-on-surface)]">
                              {cat.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-outline)]">
                            {cat.bookings} bookings
                          </span>
                          <span className="font-bold text-pink-600">
                            ₹{cat.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--color-on-surface)]">
                      Recent Bookings
                    </h2>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className="text-sm font-bold text-pink-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="py-8 text-center text-[var(--color-outline-variant)]">
                      No bookings yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                              <span className="material-symbols-outlined text-lg text-pink-600">
                                spa
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-[var(--color-on-surface)]">
                                {booking.service_type}
                              </div>
                              <div className="text-xs text-[var(--color-outline)]">
                                {booking.user_name} • {booking.scheduled_date}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[var(--color-on-surface)]">
                              ₹{booking.amount}
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                booking.status === "completed"
                                  ? "bg-green-100 text-green-600"
                                  : booking.status === "pending"
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-lg">
                {bookings.length === 0 ? (
                  <div className="py-12 text-center text-[var(--color-outline-variant)]">
                    <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
                      event_busy
                    </span>
                    <p className="mt-4 font-bold">No bookings yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                      <tr>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Service
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Customer
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Date/Time
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Amount
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-50 hover:bg-pink-50/30"
                        >
                          <td className="p-4 font-bold text-[var(--color-on-surface)]">
                            {booking.service_type}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[var(--color-on-surface)]">
                              {booking.user_name}
                            </div>
                            <div className="text-xs text-[var(--color-outline)]">
                              {booking.user_phone}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--color-on-surface)]">
                              {booking.scheduled_date}
                            </div>
                            <div className="text-xs text-[var(--color-outline)]">
                              {booking.scheduled_time}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-[var(--color-on-surface)]">
                            ₹{booking.amount}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                booking.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : booking.status === "pending"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "professionals" && (
              <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-lg">
                {providers.length === 0 ? (
                  <div className="py-12 text-center text-[var(--color-outline-variant)]">
                    <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
                      people
                    </span>
                    <p className="mt-4 font-bold">No providers yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                      <tr>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Professional
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Status
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Phone
                        </th>
                        <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((pro) => (
                        <tr key={pro.id} className="border-b border-slate-50 hover:bg-pink-50/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                                <span className="font-bold text-pink-600">
                                  {(pro.name || pro.full_name || "?")[0]}
                                </span>
                              </div>
                              <span className="font-bold text-[var(--color-on-surface)]">
                                {pro.name || pro.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                pro.status === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                              }`}
                            >
                              {pro.status || "active"}
                            </span>
                          </td>
                          <td className="p-4 text-[var(--color-on-surface-variant)]">
                            {pro.phone || "—"}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                useToastStore
                                  .getState()
                                  .addToast(
                                    `Provider: ${pro.name}\nPhone: ${pro.phone || "—"}\nStatus: ${pro.status || "active"}\nSpecialties: ${pro.specialties?.join(", ") || "—"}`,
                                    "success"
                                  )
                              }
                              className="text-sm font-bold text-pink-600 hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
