"use client";

import { useState } from "react";
import Link from "next/link";

const beautyCategories = [
  { id: "salon", label: "Salon at Home", icon: "content_cut", color: "pink", bookings: 125, revenue: 37500 },
  { id: "spa", label: "Spa & Massage", icon: "spa", color: "purple", bookings: 89, revenue: 71200 },
  { id: "nails", label: "Nail Care", icon: "brush", color: "rose", bookings: 67, revenue: 20100 },
  { id: "makeup", label: "Makeup", icon: "face", color: "amber", bookings: 45, revenue: 45000 },
  { id: "threading", label: "Threading", icon: "clear", color: "orange", bookings: 156, revenue: 7800 },
  { id: "facial", label: "Facials", icon: "auto_awesome", color: "green", bookings: 78, revenue: 23400 },
];

const recentBookings = [
  { id: "b1", service: "Full Body Waxing", user: "Priya Sharma", phone: "9876543210", address: "Andheri West, Mumbai", date: "Today", time: "02:00 PM", status: "confirmed", amount: 699 },
  { id: "b2", service: "Swedish Massage", user: "Anjali Patel", phone: "9876543211", address: "Bandra West, Mumbai", date: "Today", time: "04:30 PM", status: "pending", amount: 799 },
  { id: "b3", service: "Gel Manicure", user: "Sara Khan", phone: "9876543212", address: "Juhu, Mumbai", date: "Tomorrow", time: "11:00 AM", status: "confirmed", amount: 399 },
  { id: "b4", service: "Bridal Makeup", user: "Riya Singh", phone: "9876543213", address: "Powai, Mumbai", date: "Tomorrow", time: "09:00 AM", status: "pending", amount: 2999 },
  { id: "b5", service: "Hair Spa", user: "Meera Joshi", phone: "9876543214", address: "Kandivali, Mumbai", date: "25 Apr", time: "03:00 PM", status: "completed", amount: 499 },
];

const topProfessionals = [
  { name: "Arti Singh", category: "Salon", rating: 4.9, jobs: 156, earnings: 46800 },
  { name: "Sunita Devi", category: "Spa", rating: 4.8, jobs: 142, earnings: 56800 },
  { name: "Pooja Sharma", category: "Makeup", rating: 4.9, jobs: 98, earnings: 39200 },
  { name: "Kavita Singh", category: "Nails", rating: 4.7, jobs: 124, earnings: 37200 },
];

export default function BeautyServicesAdmin() {
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "professionals">("overview");

  const totalRevenue = beautyCategories.reduce((s, c) => s + c.revenue, 0);
  const totalBookings = beautyCategories.reduce((s, c) => s + c.bookings, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/services" className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-black">Beauty & Wellness</h1>
            </div>
            <p className="text-white/80">Manage salon, spa, nails & makeup services</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-white/80 text-sm">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 -mt-8">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-pink-600">spa</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{totalBookings}</div>
              <div className="text-xs text-slate-500">Total Bookings</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">event</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">23</div>
              <div className="text-xs text-slate-500">Today's Bookings</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">people</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">42</div>
              <div className="text-xs text-slate-500">Active Pros</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">star</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">4.8</div>
              <div className="text-xs text-slate-500">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-2 border-b border-slate-200">
          {["overview", "bookings", "professionals"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-bold text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "text-pink-600 border-b-2 border-pink-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Categories</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beautyCategories.map((cat) => (
                  <div key={cat.id} className="p-4 border border-slate-100 rounded-xl hover:border-pink-200 hover:bg-pink-50/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${cat.color}-100 rounded-xl flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-${cat.color}-600`}>{cat.icon}</span>
                        </div>
                        <span className="font-bold text-slate-800">{cat.label}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{cat.bookings} bookings</span>
                      <span className="font-bold text-pink-600">₹{cat.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
                <button onClick={() => setActiveTab("bookings")} className="text-sm font-bold text-pink-600 hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-pink-600 text-lg">spa</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{booking.service}</div>
                        <div className="text-xs text-slate-500">{booking.user} • {booking.date}, {booking.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">₹{booking.amount}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-600" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Service</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Address</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Date/Time</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Amount</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-50 hover:bg-pink-50/30">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{booking.service}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{booking.user}</div>
                      <div className="text-xs text-slate-500">{booking.phone}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[150px] truncate">{booking.address}</td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">{booking.date}</div>
                      <div className="text-xs text-slate-500">{booking.time}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">₹{booking.amount}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                        booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                        booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-pink-600 font-bold text-sm hover:underline">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "professionals" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Professional</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Category</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Rating</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Jobs</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Earnings</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {topProfessionals.map((pro, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-pink-50/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-pink-600 font-bold">{pro.name[0]}</span>
                        </div>
                        <span className="font-bold text-slate-800">{pro.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600">{pro.category}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-slate-800">{pro.rating}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">{pro.jobs}</td>
                    <td className="p-4 font-bold text-slate-800">₹{pro.earnings.toLocaleString()}</td>
                    <td className="p-4">
                      <button className="text-pink-600 font-bold text-sm hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}