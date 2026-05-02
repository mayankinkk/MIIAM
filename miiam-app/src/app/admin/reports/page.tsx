"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("orders");
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-04-23" });

  const reportTypes = [
    { id: "orders", label: "Orders", icon: "shopping_cart", description: "All order transactions" },
    { id: "revenue", label: "Revenue", icon: "payments", description: "Financial summary" },
    { id: "vendors", label: "Vendors", icon: "storefront", description: "Partner performance" },
    { id: "riders", label: "Riders", icon: "two_wheeler", description: "Delivery metrics" },
    { id: "users", label: "Users", icon: "group", description: "User analytics" },
  ];

  return (
    <div className="px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Reports</h1>
        <p className="text-slate-400 text-sm">Generate and export platform reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`p-6 rounded-2xl text-left transition-all ${
              reportType === type.id
                ? "bg-[#ba001c] text-white shadow-lg shadow-red-900/20"
                : "bg-white border border-slate-100 hover:border-slate-200"
            }`}
          >
            <span className={`material-symbols-outlined text-2xl mb-3 ${reportType === type.id ? "text-white" : "text-slate-400"}`}>
              {type.icon}
            </span>
            <p className="font-bold">{type.label}</p>
            <p className={`text-xs ${reportType === type.id ? "text-white/70" : "text-slate-400"}`}>{type.description}</p>
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Date Range</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
            />
          </div>
          <div className="flex gap-2">
            {[
              { label: "Today", days: 0 },
              { label: "7D", days: 7 },
              { label: "30D", days: 30 },
              { label: "90D", days: 90 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - preset.days);
                  setDateRange({
                    start: start.toISOString().split("T")[0],
                    end: end.toISOString().split("T")[0],
                  });
                }}
                className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportType === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Orders Report</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-200">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Preview
              </button>
              <button className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>
              <button className="px-4 py-2 bg-green-600 rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Order ID</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Vendor</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Customer</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Total</th>
                  <th className="p-4 text-xs font-black text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { id: "ORD-001", vendor: "The Burger Alchemist", customer: "John D.", status: "Delivered", total: 450, date: "2024-04-20" },
                  { id: "ORD-002", vendor: "Pizzeria d'Autore", customer: "Sarah M.", status: "Delivered", total: 320, date: "2024-04-19" },
                  { id: "ORD-003", vendor: "Spice Garden", customer: "Mike R.", status: "Cancelled", total: 180, date: "2024-04-18" },
                  { id: "ORD-004", vendor: "Sushi Zen", customer: "Emily W.", status: "Delivered", total: 890, date: "2024-04-17" },
                  { id: "ORD-005", vendor: "The Burger Alchemist", customer: "Alex P.", status: "On the Way", total: 520, date: "2024-04-16" },
                ].map((order) => (
                  <tr key={order.id}>
                    <td className="p-4 font-bold text-slate-800">{order.id}</td>
                    <td className="p-4 text-sm text-slate-600">{order.vendor}</td>
                    <td className="p-4 text-sm text-slate-600">{order.customer}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        order.status === "Delivered" ? "bg-green-100 text-green-700" :
                        order.status === "Cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">₹{order.total}</td>
                    <td className="p-4 text-sm text-slate-600">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 text-center text-xs text-slate-400">
            Showing 5 of 1,247 orders
          </div>
        </div>
      )}

      {reportType === "revenue" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Revenue Report</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>
              <button className="px-4 py-2 bg-green-600 rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                PDF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</p>
              <p className="text-2xl font-black text-slate-800 mt-2">₹12,45,890</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Net Revenue</p>
              <p className="text-2xl font-black text-slate-800 mt-2">₹9,85,420</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Platform Fee</p>
              <p className="text-2xl font-black text-slate-800 mt-2">₹1,86,890</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Refunds</p>
              <p className="text-2xl font-black text-red-600 mt-2">₹12,450</p>
            </div>
          </div>
        </div>
      )}

      {reportType === "vendors" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Vendor Performance Report</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">download</span>
                Export
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Vendor</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Orders</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Revenue</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Rating</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: "The Burger Alchemist", orders: 450, revenue: 185000, rating: 4.9, commission: 27750 },
                { name: "Pizzeria d'Autore", orders: 320, revenue: 142000, rating: 4.8, commission: 21300 },
                { name: "Spice Garden", orders: 280, revenue: 98000, rating: 4.6, commission: 14700 },
              ].map((vendor) => (
                <tr key={vendor.name}>
                  <td className="p-4 font-bold text-slate-800">{vendor.name}</td>
                  <td className="p-4 text-sm text-slate-600">{vendor.orders}</td>
                  <td className="p-4 font-bold text-slate-800">₹{vendor.revenue.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                      {vendor.rating}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">₹{vendor.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "riders" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Rider Performance Report</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">download</span>
                Export
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Rider</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Deliveries</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Hours</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Rating</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: "Mohit K.", deliveries: 1250, hours: 480, rating: 4.9, earnings: 285000 },
                { name: "Rahul S.", deliveries: 890, hours: 420, rating: 4.8, earnings: 196000 },
                { name: "Amit S.", deliveries: 620, hours: 360, rating: 4.7, earnings: 142000 },
              ].map((rider) => (
                <tr key={rider.name}>
                  <td className="p-4 font-bold text-slate-800">{rider.name}</td>
                  <td className="p-4 text-sm text-slate-600">{rider.deliveries}</td>
                  <td className="p-4 text-sm text-slate-600">{rider.hours}h</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                      {rider.rating}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">₹{rider.earnings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "users" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">User Analytics Report</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                <span className="material-symbols-outlined text-sm">download</span>
                Export
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Users</p>
              <p className="text-2xl font-black text-slate-800 mt-2">12,450</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">New This Month</p>
              <p className="text-2xl font-black text-slate-800 mt-2">850</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Active Users</p>
              <p className="text-2xl font-black text-slate-800 mt-2">8,420</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Churn Rate</p>
              <p className="text-2xl font-black text-slate-800 mt-2">2.4%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}