"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const supabase = createClient();

interface ServiceBooking {
  id: string;
  user_id: string | null;
  user_name?: string;
  user_phone?: string;
  service_type: string;
  sub_service?: string;
  amount?: number;
  status: string;
  technician_name?: string;
  technician_phone?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface ServiceDetail {
  name: string;
  icon: string;
  color: string;
  bg: string;
}

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  plumbing: { name: "Plumbing", icon: "plumbing", color: "blue", bg: "bg-accent/10" },
  electrical: { name: "Electrical", icon: "bolt", color: "amber", bg: "bg-amber-50" },
  cleaning: { name: "Cleaning", icon: "cleaning_services", color: "emerald", bg: "bg-emerald-50" },
  ac: { name: "AC Repair", icon: "ac_unit", color: "cyan", bg: "bg-cyan-50" },
  appliance: {
    name: "Appliance Repair",
    icon: "home_repair_service",
    color: "purple",
    bg: "bg-accent/10",
  },
  pest: { name: "Pest Control", icon: "bug_report", color: "red", bg: "bg-red-50" },
};

const COLOR_MAP: Record<string, string> = {
  blue: "from-accent to-accent/70",
  amber: "from-amber-500 to-amber-400",
  emerald: "from-emerald-500 to-emerald-400",
  cyan: "from-cyan-500 to-cyan-400",
  purple: "from-deal to-deal/70",
  red: "from-red-500 to-red-400",
};

const TEXT_COLOR: Record<string, string> = {
  blue: "text-status-info",
  amber: "text-status-warning",
  emerald: "text-emerald-500",
  cyan: "text-cyan-500",
  purple: "text-accent",
  red: "text-status-error",
};

export default function AdminServiceDetail({ serviceKey }: { serviceKey: string }) {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assignBooking, setAssignBooking] = useState<ServiceBooking | null>(null);
  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [dbService, setDbService] = useState<ServiceDetail | null>(null);
  const service = dbService ||
    SERVICE_DETAILS[serviceKey] || {
      name: serviceKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "home_repair_service",
      color: "blue",
      bg: "bg-accent/10",
    };

  useEffect(() => {
    loadBookings();
    if (!SERVICE_DETAILS[serviceKey]) {
      supabase
        .from("service_categories")
        .select("name, icon")
        .eq("slug", serviceKey)
        .maybeSingle()
        .then(({ data }: { data: { name: string; icon: string | null } | null }) => {
          if (data)
            setDbService({
              name: data.name,
              icon: data.icon || "home_repair_service",
              color: "blue",
              bg: "bg-accent/10",
            });
        });
    }
  }, []);

  async function loadBookings() {
    const { data } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("service_type", serviceKey)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setBookings(data);
    setLoading(false);
  }

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    const prev = bookings;
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);
      if (error) throw error;

      if (booking?.user_id) {
        const statusMessages: Record<string, { title: string; body: string }> = {
          confirmed: {
            title: "Booking Confirmed ✓",
            body: `Your ${booking.sub_service || booking.service_type} booking has been confirmed.`,
          },
          in_progress: {
            title: "Technician On The Way 🔧",
            body: `A technician is on the way for your ${booking.sub_service || booking.service_type} service.`,
          },
          completed: {
            title: "Service Completed ✓",
            body: `Your ${booking.sub_service || booking.service_type} service has been completed. Rate your experience!`,
          },
          cancelled: {
            title: "Booking Cancelled",
            body: `Your ${booking.sub_service || booking.service_type} booking has been cancelled.`,
          },
        };
        const notif = statusMessages[newStatus];
        if (notif) {
          await supabase.from("notifications").insert({
            user_id: booking.user_id,
            title: notif.title,
            body: notif.body,
            type: "booking",
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      logger.error({ err: e }, "[AdminServiceDetail] Failed to update status");
      setBookings(prev);
    }
    setUpdatingId(null);
  }

  async function handleDelete(bookingId: string) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    const prev = bookings;
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    try {
      const { error } = await supabase.from("service_bookings").delete().eq("id", bookingId);
      if (error) throw error;
    } catch (e) {
      logger.error({ err: e }, "[AdminServiceDetail] Failed to delete booking");
      setBookings(prev);
    }
  }

  async function handleAssignTechnician() {
    if (!assignBooking || !techName.trim()) return;
    setAssigning(true);
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ technician_name: techName.trim(), technician_phone: techPhone.trim() })
        .eq("id", assignBooking.id);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === assignBooking.id
            ? { ...b, technician_name: techName.trim(), technician_phone: techPhone.trim() }
            : b
        )
      );
      if (assignBooking.user_id) {
        await supabase.from("notifications").insert({
          user_id: assignBooking.user_id,
          title: "Technician Assigned ✓",
          body: `${techName.trim()} has been assigned to your ${assignBooking.sub_service || assignBooking.service_type} service. Contact: ${techPhone.trim() || "N/A"}`,
          type: "booking",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
      setAssignBooking(null);
      setTechName("");
      setTechPhone("");
    } catch (e) {
      logger.error({ err: e }, "[AdminServiceDetail] Failed to assign technician");
    }
    setAssigning(false);
  }

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((s: number, b: ServiceBooking) => s + (b.amount || 0), 0);
  const completedCount = bookings.filter((b: ServiceBooking) => b.status === "completed").length;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-status-info/10 text-status-info",
    in_progress: "bg-deal/10 text-deal",
    completed: "bg-status-success/10 text-status-success",
    cancelled: "bg-status-error/10 text-status-error",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/services"
          className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className={`h-10 w-10 rounded-xl ${service.bg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-xl ${TEXT_COLOR[service.color]}`}>
            {service.icon}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--color-on-surface)]">{service.name}</h2>
          <p className="text-xs text-[var(--color-outline-variant)]">
            Manage bookings and providers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
            Total Bookings
          </p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">
            {loading ? "—" : totalBookings}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Revenue</p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">
            {loading ? "—" : `₹${totalRevenue.toLocaleString("en-IN")}`}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
            Completed
          </p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">
            {loading ? "—" : completedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
            Completion Rate
          </p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">
            {loading ? "—" : `${completionRate}%`}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-slate-50 p-5">
          <h3 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            Recent Bookings
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-outline-variant)]">
            No bookings found
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Customer
                </th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Phone
                </th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Technician
                </th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Amount
                </th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Date
                </th>
                <th className="p-4 text-right text-xs font-black text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((b: ServiceBooking) => (
                <tr key={b.id}>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">
                    {b.user_name || "—"}
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                    {b.user_phone || "—"}
                  </td>
                  <td className="p-4">
                    {b.technician_name ? (
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">
                          {b.technician_name}
                        </p>
                        {b.technician_phone && (
                          <p className="text-xs text-[var(--color-outline-variant)]">
                            {b.technician_phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignBooking(b);
                          setTechName("");
                          setTechPhone("");
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">
                    ₹{(b.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4">
                    <select
                      value={b.status || "pending"}
                      disabled={updatingId === b.id}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${statusColors[b.status] || "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="hover:text-status-error hover:bg-status-error/10 rounded-lg p-1.5 text-[var(--color-outline-variant)] transition-colors"
                      title="Delete booking"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {assignBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-black text-[var(--color-on-surface)]">
              Assign Technician
            </h3>
            <p className="mb-5 text-sm text-[var(--color-outline-variant)]">
              {assignBooking.sub_service || assignBooking.service_type} —{" "}
              {assignBooking.user_name || "Customer"}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--color-on-surface)]">
                  Technician Name *
                </label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] px-4 py-3 text-sm font-bold text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--color-on-surface)]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  placeholder="e.g. +91 99578 73472"
                  className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] px-4 py-3 text-sm font-bold text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setAssignBooking(null);
                  setTechName("");
                  setTechPhone("");
                }}
                className="flex-1 rounded-xl bg-[var(--color-surface-container)] py-3 text-sm font-bold text-[var(--color-on-surface-variant)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                disabled={!techName.trim() || assigning}
                className="text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold disabled:opacity-50"
              >
                {assigning ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {assigning ? "Assigning..." : "Assign Technician"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
