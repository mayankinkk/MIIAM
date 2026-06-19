"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

type ServiceStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

interface ServiceBooking {
  id: string;
  service_type: string;
  user_name: string;
  user_phone: string;
  address: string;
  scheduled_date: string;
  scheduled_time: string;
  status: ServiceStatus;
  amount: number;
  provider_id: string | null;
  provider_name: string | null;
  created_at: string;
}

const serviceOptions = [
  { id: "beauty", label: "Beauty & Wellness", icon: "spa", color: "text-pink-500", bg: "bg-pink-50" },
  { id: "ac", label: "AC Repair", icon: "ac_unit", color: "text-blue-500", bg: "bg-blue-50" },
  { id: "plumbing", label: "Plumbing", icon: "plumbing", color: "text-cyan-500", bg: "bg-cyan-50" },
  { id: "electrical", label: "Electrical", icon: "electrical_services", color: "text-amber-500", bg: "bg-amber-50" },
  { id: "cleaning", label: "Cleaning", icon: "cleaning_services", color: "text-green-500", bg: "bg-green-50" },
  { id: "appliance", label: "Appliance", icon: "kitchen", color: "text-purple-500", bg: "bg-purple-50" },
  { id: "pest", label: "Pest Control", icon: "bug_report", color: "text-red-500", bg: "bg-red-50" },
];

export default function EnhancedServicesDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "providers" | "settings">("dashboard");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [providerForm, setProviderForm] = useState({ name: "", phone: "", email: "", service_type: "beauty", experience: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "home_repair_service", description: "" });
  const [pricing, setPricing] = useState({ commission: "15", minOrder: "199", cancelWindow: "2" });

  useEffect(() => {
    loadBookings();
    loadPricing();
  }, [statusFilter, serviceFilter, supabase]);

  async function loadPricing() {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const { settings } = await res.json();
      setPricing({
        commission: settings.service_commission || "15",
        minOrder: settings.service_min_order || "199",
        cancelWindow: settings.service_cancel_window || "2",
      });
    } catch { /* settings may not exist yet */ }
  }

  async function loadBookings() {
    setLoading(true);
    let query = supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (serviceFilter !== "all") {
      query = query.eq("service_type", serviceFilter);
    }

    const { data } = await query.limit(50);
    if (data) setBookings(data);
    setLoading(false);
  }

  async function updateBookingStatus(bookingId: string, newStatus: ServiceStatus) {
    await supabase
      .from("service_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: newStatus } : b
    ));
  }

  const totalRevenue = bookings
    .filter(b => b.status === "completed")
    .reduce((s, b) => s + (b.amount || 0), 0);

  const stats = {
    totalGMV: totalRevenue,
    activeBookings: bookings.filter(b => ["pending", "confirmed", "in_progress"].includes(b.status)).length,
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === "completed").length,
  };

  const statusCounts = {
    pending: bookings.filter(b => b.status === "pending").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const serviceStats = serviceOptions.map(s => {
    const typeBookings = bookings.filter(b => b.service_type === s.id);
    const typeRevenue = typeBookings
      .filter(b => b.status === "completed")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    return { ...s, orders: typeBookings.length, revenue: typeRevenue };
  });

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Services Dashboard</h1>
          <p className="text-[var(--color-outline)]">Manage all home services bookings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const rows = [["Booking ID", "Service", "Customer", "Phone", "Address", "Date", "Time", "Status", "Amount"]];
              bookings.forEach(b => {
                rows.push([b.id.slice(0, 8).toUpperCase(), b.service_type, b.user_name, b.user_phone, b.address, b.scheduled_date, b.scheduled_time, b.status, String(b.amount)]);
              });
              const csv = rows.map(r => r.map(v => v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "service-bookings.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm flex items-center gap-2 hover:border-[var(--color-primary)]"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Service
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-1 inline-flex">
        {(["dashboard", "bookings", "providers", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
              activeTab === tab
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)]"
            }`}
          >
            {tab === "dashboard" ? "Overview" : tab === "providers" ? "Providers" : tab}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-3xl text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total Revenue</span>
              </div>
              <p className="text-4xl font-black">₹{stats.totalGMV.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-2">from {stats.completedBookings} completed bookings</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Active Bookings</span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">{stats.activeBookings}</p>
              <p className="text-xs text-green-500 mt-2">Live tracking</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-purple-500">receipt_long</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Total Bookings</span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">{stats.totalBookings}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-2">All time</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500">check_circle</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Completed</span>
              </div>
              <p className="text-3xl font-black text-green-600">{stats.completedBookings}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-2">Successfully delivered</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Service Overview</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                  {serviceStats.map((service) => (
                    <Link
                      key={service.id}
                      href={`/admin/services/${service.id}`}
                      className="bg-[var(--color-surface-subtle)] rounded-2xl p-4 hover:bg-[#ffecee] transition-colors group border border-transparent hover:border-[var(--color-primary)]"
                    >
                      <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-3`}>
                        <span className={`material-symbols-outlined ${service.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{service.icon}</span>
                      </div>
                      <p className="font-bold text-[var(--color-on-surface)] text-sm mb-2">{service.label}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--color-outline)]">Orders</span>
                          <span className="font-bold text-[var(--color-on-surface)]">{service.orders}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--color-outline)]">Revenue</span>
                          <span className="font-bold text-green-600">₹{service.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full py-2 bg-[var(--color-surface-container-lowest)]/20 rounded-xl text-sm font-bold hover:bg-[var(--color-surface-container-lowest)]/30 transition-colors text-left px-4"
                  >
                    + Add New Service
                  </button>
                  <button
                    onClick={() => setActiveTab("providers")}
                    className="w-full py-2 bg-[var(--color-surface-container-lowest)]/20 rounded-xl text-sm font-bold hover:bg-[var(--color-surface-container-lowest)]/30 transition-colors text-left px-4"
                  >
                    Manage Providers
                  </button>
                  <Link
                    href="/admin/analytics"
                    className="block w-full py-2 bg-[var(--color-surface-container-lowest)]/20 rounded-xl text-sm font-bold hover:bg-[var(--color-surface-container-lowest)]/30 transition-colors text-left px-4"
                  >
                    View Analytics
                  </Link>
                </div>
              </div>

              <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 border border-[var(--color-border-subtle)] shadow-sm">
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Bookings by Status</h3>
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--color-on-surface-variant)] capitalize">{status.replaceAll("_", " ")}</span>
                      <span className="font-black text-[var(--color-on-surface)]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Recent Bookings</h2>
              <button
                onClick={() => setActiveTab("bookings")}
                className="text-sm font-bold text-[var(--color-primary)] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Recent Service Bookings</caption>
                <thead className="bg-[var(--color-surface-subtle)]">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">ID</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Service</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Customer</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Date</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Status</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="hover:bg-[var(--color-surface-subtle)]">
                      <td className="p-4 font-bold text-[var(--color-on-surface)]">#{booking.id.slice(0, 8)}</td>
                      <td className="p-4 text-[var(--color-on-surface-variant)] capitalize">{booking.service_type}</td>
                      <td className="p-4 text-[var(--color-on-surface-variant)]">{booking.user_name}</td>
                      <td className="p-4 text-[var(--color-outline)]">{booking.scheduled_date}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                          booking.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          booking.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          booking.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}>
                          {booking.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-[var(--color-on-surface)]">₹{booking.amount}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--color-outline-variant)]">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "bookings" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(["all", "pending", "in_progress", "completed", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                    statusFilter === status
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                  }`}
                >
                  {status === "all" ? "All" : status.replaceAll("_", " ")}
                </button>
              ))}
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              aria-label="Filter by service type"
              className="ml-auto px-4 py-2 bg-[var(--color-surface-subtle)] rounded-lg text-sm font-bold"
            >
              <option value="all">All Services</option>
              {serviceOptions.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Service Bookings</caption>
                <thead className="bg-[var(--color-surface-subtle)]">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Booking ID</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Service</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Customer</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Phone</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Address</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Schedule</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Provider</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Status</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase text-right">Amount</th>
                    <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4 font-bold text-[var(--color-on-surface)]">#{booking.id.slice(0, 8)}</td>
                    <td className="p-4 text-[var(--color-on-surface-variant)] capitalize">{booking.service_type}</td>
                    <td className="p-4 text-[var(--color-on-surface-variant)]">{booking.user_name}</td>
                    <td className="p-4 text-[var(--color-outline)]">{booking.user_phone}</td>
                    <td className="p-4 text-[var(--color-outline)] max-w-[200px] truncate">{booking.address}</td>
                    <td className="p-4 text-[var(--color-outline)]">
                      <div>{booking.scheduled_date}</div>
                      <div className="text-xs">{booking.scheduled_time}</div>
                    </td>
                    <td className="p-4 text-[var(--color-on-surface-variant)]">
                      {booking.provider_name || <span className="text-[var(--color-outline-variant)]">Unassigned</span>}
                    </td>
                    <td className="p-4">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value as ServiceStatus)}
                        className={`text-[10px] font-black px-2 py-1 rounded-full border-0 cursor-pointer ${
                          booking.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          booking.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          booking.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-black text-[var(--color-on-surface)]">₹{booking.amount}</td>
                    <td className="p-4">
                      <Link
                        href={`/admin/services/${booking.service_type}`}
                        className="text-[var(--color-primary)] hover:underline text-xs font-bold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[var(--color-outline-variant)]">
                      No bookings found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "providers" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-[var(--color-on-surface)]">Service Providers</h2>
            <button
              onClick={() => setShowProviderModal(true)}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Provider
            </button>
          </div>
          <div className="text-center py-12 text-[var(--color-outline-variant)]">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">people</span>
            <p className="mt-4 font-bold">No providers yet</p>
            <p className="text-sm mt-1">Add service providers to get started</p>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
            <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Service Categories</h2>
            <div className="space-y-3">
              {serviceOptions.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${service.color}`}>{service.icon}</span>
                    <span className="font-bold text-[var(--color-on-surface)]">{service.label}</span>
                  </div>
                  <Link
                    href="/admin/services-settings"
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    Configure
                  </Link>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl text-[var(--color-outline)] font-bold text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              + Add New Category
            </button>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
            <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Pricing & Commission</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                <span className="font-bold text-[var(--color-on-surface)]">Platform Commission</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pricing.commission}
                    onChange={(e) => setPricing({ ...pricing, commission: e.target.value })}
                    aria-label="Platform commission percentage"
                    className="w-16 text-right font-black text-[var(--color-on-surface)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                  />
                  <span className="font-bold text-[var(--color-outline)]">%</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                <span className="font-bold text-[var(--color-on-surface)]">Minimum Order Value</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[var(--color-outline)]">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={pricing.minOrder}
                    onChange={(e) => setPricing({ ...pricing, minOrder: e.target.value })}
                    aria-label="Minimum order value in rupees"
                    className="w-20 text-right font-black text-[var(--color-on-surface)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                <span className="font-bold text-[var(--color-on-surface)]">Cancellation Window</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={pricing.cancelWindow}
                    onChange={(e) => setPricing({ ...pricing, cancelWindow: e.target.value })}
                    aria-label="Cancellation window in hours"
                    className="w-16 text-right font-black text-[var(--color-on-surface)] bg-transparent border-b-2 border-transparent focus:border-[var(--color-primary)] outline-none"
                  />
                  <span className="font-bold text-[var(--color-outline)]">hrs</span>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    settings: {
                      service_commission: pricing.commission,
                      service_min_order: pricing.minOrder,
                      service_cancel_window: pricing.cancelWindow,
                    },
                  }),
                });
                useToastStore.getState().addToast("Pricing settings saved", "success");
              }}
              className="w-full mt-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm"
            >
              Update Settings
            </button>
          </div>
        </div>
      )}

      {/* Provider Registration Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="provider-modal-title" onKeyDown={(e) => e.key === "Escape" && setShowProviderModal(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-md p-6">
            <h3 id="provider-modal-title" className="font-bold text-lg mb-4">Register Service Provider</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Full Name" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
              <input type="tel" placeholder="Phone Number" value={providerForm.phone} onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
              <input type="email" placeholder="Email" value={providerForm.email} onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
              <select value={providerForm.service_type} onChange={(e) => setProviderForm({ ...providerForm, service_type: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm">
                {serviceOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <input type="text" placeholder="Years of experience" value={providerForm.experience} onChange={(e) => setProviderForm({ ...providerForm, experience: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowProviderModal(false)} className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm">Cancel</button>
              <button
                onClick={async () => {
                  if (!providerForm.name || !providerForm.phone) { useToastStore.getState().addToast("Name and phone are required", "error"); return; }
                  const { error } = await supabase.from("service_providers").insert({
                    name: providerForm.name, phone: providerForm.phone, email: providerForm.email,
                    service_type: providerForm.service_type, experience: providerForm.experience, status: "pending",
                  });
                  if (error) { useToastStore.getState().addToast("Error: " + error.message, "error"); return; }
                  useToastStore.getState().addToast("Provider registered successfully!", "success");
                  setShowProviderModal(false);
                  setProviderForm({ name: "", phone: "", email: "", service_type: "beauty", experience: "" });
                }}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="category-modal-title" onKeyDown={(e) => e.key === "Escape" && setShowCategoryModal(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-md p-6">
            <h3 id="category-modal-title" className="font-bold text-lg mb-4">Add Service Category</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
              <input type="text" placeholder="Icon name (e.g., construction, clean_hands)" value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm" />
              <textarea placeholder="Description (optional)" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="w-full border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm h-20 resize-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm">Cancel</button>
              <button
                onClick={async () => {
                  if (!categoryForm.name) { useToastStore.getState().addToast("Category name is required", "error"); return; }
                  const { error } = await supabase.from("service_categories").insert({
                    name: categoryForm.name, icon: categoryForm.icon, description: categoryForm.description, is_active: true,
                  });
                  if (error) { useToastStore.getState().addToast("Error: " + error.message, "error"); return; }
                  useToastStore.getState().addToast("Category created!", "success");
                  setShowCategoryModal(false);
                  setCategoryForm({ name: "", icon: "home_repair_service", description: "" });
                }}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
