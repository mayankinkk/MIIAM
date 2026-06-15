"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface ServiceDetail {
  name: string;
  icon: string;
  color: string;
  bg: string;
}

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  plumbing: { name: "Plumbing", icon: "plumbing", color: "blue", bg: "bg-blue-50" },
  electrical: { name: "Electrical", icon: "bolt", color: "amber", bg: "bg-amber-50" },
  cleaning: { name: "Cleaning", icon: "cleaning_services", color: "emerald", bg: "bg-emerald-50" },
  ac: { name: "AC Repair", icon: "ac_unit", color: "cyan", bg: "bg-cyan-50" },
  appliance: { name: "Appliance Repair", icon: "home_repair_service", color: "purple", bg: "bg-purple-50" },
  pest: { name: "Pest Control", icon: "bug_report", color: "red", bg: "bg-red-50" },
};

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500 to-blue-400",
  amber: "from-amber-500 to-amber-400",
  emerald: "from-emerald-500 to-emerald-400",
  cyan: "from-cyan-500 to-cyan-400",
  purple: "from-purple-500 to-purple-400",
  red: "from-red-500 to-red-400",
};

const TEXT_COLOR: Record<string, string> = {
  blue: "text-blue-500",
  amber: "text-amber-500",
  emerald: "text-emerald-500",
  cyan: "text-cyan-500",
  purple: "text-purple-500",
  red: "text-red-500",
};

export default function AdminServiceDetail({ serviceKey }: { serviceKey: string }) {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const service = SERVICE_DETAILS[serviceKey] || SERVICE_DETAILS.plumbing;

  useEffect(() => { loadBookings(); }, []);

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
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    try {
      const { error } = await supabase
        .from("service_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);
      if (error) throw error;
    } catch (e) {
      console.error("[AdminServiceDetail] Failed to update status:", e);
      setBookings(prev);
    }
    setUpdatingId(null);
  }

  async function handleDelete(bookingId: string) {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    const prev = bookings;
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    try {
      const { error } = await supabase
        .from("service_bookings")
        .delete()
        .eq("id", bookingId);
      if (error) throw error;
    } catch (e) {
      console.error("[AdminServiceDetail] Failed to delete booking:", e);
      setBookings(prev);
    }
  }

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.total_amount || 0), 0);
  const completedCount = bookings.filter((b: any) => b.status === "completed").length;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/services" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className={`w-10 h-10 rounded-xl ${service.bg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-xl ${TEXT_COLOR[service.color]}`}>{service.icon}</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">{service.name}</h2>
          <p className="text-xs text-slate-400">Manage bookings and providers</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Bookings</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "—" : totalBookings}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Revenue</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "—" : `₹${totalRevenue.toLocaleString("en-IN")}`}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "—" : completedCount}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Completion Rate</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{loading ? "—" : `${completionRate}%`}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-50">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Recent Bookings</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" /></div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No bookings found</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Customer</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Address</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Amount</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Date</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((b: any) => (
                <tr key={b.id}>
                  <td className="p-4 font-bold text-slate-800">{b.customer_name || "—"}</td>
                  <td className="p-4 text-sm text-slate-600 truncate max-w-[200px]">{b.address || "—"}</td>
                  <td className="p-4 font-bold text-slate-800">₹{(b.total_amount || 0).toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <select
                      value={b.status || "pending"}
                      disabled={updatingId === b.id}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer disabled:opacity-50 ${statusColors[b.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
