"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  { id: "beauty", label: "Beauty & Wellness", icon: "spa", color: "text-pink-500", bg: "bg-pink-50", total: 85, revenue: 65000, orders: 245, rating: 4.8, growth: 28 },
  { id: "ac", label: "AC Repair", icon: "ac_unit", color: "text-blue-500", bg: "bg-blue-50", total: 45, revenue: 45000, orders: 180, rating: 4.7, growth: 15 },
  { id: "plumbing", label: "Plumbing", icon: "plumbing", color: "text-cyan-500", bg: "bg-cyan-50", total: 38, revenue: 28000, orders: 134, rating: 4.6, growth: 8 },
  { id: "electrical", label: "Electrical", icon: "electrical_services", color: "text-amber-500", bg: "bg-amber-50", total: 32, revenue: 22000, orders: 98, rating: 4.8, growth: 12 },
  { id: "cleaning", label: "Cleaning", icon: "cleaning_services", color: "text-green-500", bg: "bg-green-50", total: 52, revenue: 78000, orders: 156, rating: 4.9, growth: 22 },
  { id: "appliance", label: "Appliance", icon: "kitchen", color: "text-purple-500", bg: "bg-purple-50", total: 18, revenue: 15000, orders: 67, rating: 4.5, growth: 5 },
  { id: "pest", label: "Pest Control", icon: "bug_report", color: "text-red-500", bg: "bg-red-50", total: 12, revenue: 9000, orders: 45, rating: 4.7, growth: 3 },
];

export default function EnhancedServicesDashboard() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "providers" | "settings">("dashboard");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  useEffect(() => {
    loadBookings();
  }, [statusFilter, serviceFilter, supabase]);

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

  const stats = {
    totalGMV: serviceOptions.reduce((s, o) => s + o.revenue, 0),
    activeBookings: bookings.filter(b => ["pending", "confirmed", "in_progress"].includes(b.status)).length,
    providers: 48,
    satisfaction: 4.9,
  };

  const statusCounts = {
    pending: bookings.filter(b => b.status === "pending").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Services Dashboard</h1>
          <p className="text-slate-500">Manage all home services bookings</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-[#ba001c]">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
          <button className="px-4 py-2 bg-[#ba001c] text-white rounded-xl font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Service
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-1 inline-flex">
        {(["dashboard", "bookings", "providers", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
              activeTab === tab
                ? "bg-[#ba001c] text-white"
                : "text-slate-500 hover:bg-slate-50"
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
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total GMV</span>
              </div>
              <p className="text-4xl font-black">₹{stats.totalGMV.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-2">+8.2% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Bookings</span>
              </div>
              <p className="text-3xl font-black text-slate-800">{stats.activeBookings}</p>
              <p className="text-xs text-green-500 mt-2">Live tracking</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-purple-500">people</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Providers</span>
              </div>
              <p className="text-3xl font-black text-slate-800">{stats.providers}</p>
              <p className="text-xs text-green-500 mt-2">+3 this week</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500">thumb_up</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Satisfaction</span>
              </div>
              <p className="text-3xl font-black text-slate-800">{stats.satisfaction}/5</p>
              <p className="text-xs text-green-500 mt-2">+0.2 this month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Service Overview</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                  {serviceOptions.map((service) => (
                    <Link
                      key={service.id}
                      href={`/admin/services/${service.id}`}
                      className="bg-slate-50 rounded-2xl p-4 hover:bg-[#ffecee] transition-colors group border border-transparent hover:border-[#ba001c]"
                    >
                      <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-3`}>
                        <span className={`material-symbols-outlined ${service.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{service.icon}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm mb-2">{service.label}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Orders</span>
                          <span className="font-bold text-slate-700">{service.orders}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Revenue</span>
                          <span className="font-bold text-green-600">₹{(service.revenue / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Rating</span>
                          <span className="font-bold text-amber-600">⭐ {service.rating}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Growth</span>
                          <span className="font-bold text-green-600">↑{service.growth}%</span>
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
                  <button className="w-full py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors text-left px-4">
                    + Add New Service
                  </button>
                  <button className="w-full py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors text-left px-4">
                    Manage Providers
                  </button>
                  <button className="w-full py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition-colors text-left px-4">
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba001c]">today</span>
                  Today's Schedule
                </h3>
                <div className="space-y-3">
                  {[
                    { time: "09:00 AM", service: "AC Repair", address: "Andheri West", status: "upcoming" },
                    { time: "11:30 AM", service: "Haircut & Styling", address: "Bandra", status: "upcoming" },
                    { time: "02:00 PM", service: "Plumbing", address: "Juhu", status: "upcoming" },
                    { time: "04:30 PM", service: "Full Body Waxing", address: "Powai", status: "upcoming" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs font-bold text-slate-500 w-20">{item.time}</div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{item.service}</p>
                        <p className="text-xs text-slate-500">{item.address}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Upcoming</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Providers */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">workspace_premium</span>
                  Top Providers
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Arti Singh", service: "Beauty", jobs: 156, rating: 4.9 },
                    { name: "Sunita Devi", service: "Spa", jobs: 142, rating: 4.8 },
                    { name: "Ramesh Kumar", service: "AC Repair", jobs: 128, rating: 4.7 },
                    { name: "Priya Sharma", service: "Cleaning", jobs: 115, rating: 4.9 },
                  ].map((provider, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-[#ba001c] rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{provider.name}</p>
                        <p className="text-xs text-slate-500">{provider.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-sm">{provider.jobs} jobs</p>
                        <p className="text-xs text-amber-600">⭐ {provider.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Bookings by Status</h3>
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 capitalize">{status.replace("_", " ")}</span>
                      <span className="font-black text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Recent Bookings</h2>
              <button 
                onClick={() => setActiveTab("bookings")}
                className="text-sm font-bold text-[#ba001c] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">ID</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Service</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Customer</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">#{booking.id.slice(0, 8)}</td>
                      <td className="p-4 text-slate-600 capitalize">{booking.service_type}</td>
                      <td className="p-4 text-slate-600">{booking.user_name}</td>
                      <td className="p-4 text-slate-500">{booking.scheduled_date}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                          booking.status === "completed" ? "bg-green-100 text-green-700" :
                          booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                          booking.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {booking.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">₹{booking.amount}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
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
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(["all", "pending", "in_progress", "completed", "cancelled"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                    statusFilter === status
                      ? "bg-[#ba001c] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status === "all" ? "All" : status.replace("_", " ")}
                </button>
              ))}
            </div>
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="ml-auto px-4 py-2 bg-slate-50 rounded-lg text-sm font-bold"
            >
              <option value="all">All Services</option>
              {serviceOptions.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Booking ID</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Service</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Customer</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Phone</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Address</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Schedule</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Provider</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">#{booking.id.slice(0, 8)}</td>
                    <td className="p-4 text-slate-600 capitalize">{booking.service_type}</td>
                    <td className="p-4 text-slate-600">{booking.user_name}</td>
                    <td className="p-4 text-slate-500">{booking.user_phone}</td>
                    <td className="p-4 text-slate-500 max-w-[200px] truncate">{booking.address}</td>
                    <td className="p-4 text-slate-500">
                      <div>{booking.scheduled_date}</div>
                      <div className="text-xs">{booking.scheduled_time}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {booking.provider_name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="p-4">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value as ServiceStatus)}
                        className={`text-[10px] font-black px-2 py-1 rounded-full border-0 cursor-pointer ${
                          booking.status === "completed" ? "bg-green-100 text-green-700" :
                          booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                          booking.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">₹{booking.amount}</td>
                    <td className="p-4">
                      <button className="text-[#ba001c] hover:underline text-xs font-bold">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800">Service Providers</h2>
            <button className="px-4 py-2 bg-[#ba001c] text-white rounded-xl font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              Add Provider
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Rahul Sharma", service: "AC Repair", rating: 4.9, jobs: 156, status: "online" },
              { name: "Amit Kumar", service: "Plumbing", rating: 4.7, jobs: 89, status: "online" },
              { name: "Suresh Patel", service: "Electrical", rating: 4.8, jobs: 124, status: "offline" },
              { name: "Vijay Singh", service: "Cleaning", rating: 4.6, jobs: 67, status: "online" },
              { name: "Raj Malhotra", service: "Pest Control", rating: 4.9, jobs: 45, status: "online" },
              { name: "Kiran Gupta", service: "Appliance", rating: 4.5, jobs: 34, status: "offline" },
            ].map((provider, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#ba001c]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ba001c]">person</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{provider.name}</p>
                    <p className="text-xs text-slate-500">{provider.service}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${provider.status === "online" ? "bg-green-500" : "bg-slate-400"}`} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold text-slate-700">{provider.rating}</span>
                  </div>
                  <span className="text-xs text-slate-500">{provider.jobs} jobs completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-6">Service Categories</h2>
            <div className="space-y-3">
              {serviceOptions.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${service.color}`}>{service.icon}</span>
                    <span className="font-bold text-slate-700">{service.label}</span>
                  </div>
                  <button className="text-xs font-bold text-[#ba001c] hover:underline">Configure</button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:border-[#ba001c] hover:text-[#ba001c] transition-colors">
              + Add New Category
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-6">Pricing & Commission</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">Platform Commission</span>
                <span className="font-black text-slate-800">15%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">Minimum Order Value</span>
                <span className="font-black text-slate-800">₹199</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">Cancellation Window</span>
                <span className="font-black text-slate-800">2 hours</span>
              </div>
            </div>
            <button className="w-full mt-4 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm">
              Update Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}