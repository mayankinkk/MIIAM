"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const mockOrders = [
  { id: "MED001", customer: "Rahul S.", items: "Dolo 650, Crosin, Vitamins", total: 185, status: "delivered", date: "Today, 9:00 AM", prescription: false },
  { id: "MED002", customer: "Priya K.", items: "Diabetes medicines (Rx)", total: 890, status: "preparing", date: "Today, 10:45 AM", prescription: true },
  { id: "MED003", customer: "Vikram M.", items: "Pain relief, muscle relaxant", total: 145, status: "delivered", date: "Yesterday", prescription: false },
  { id: "MED004", customer: "Anita R.", items: "Baby care medicines", total: 320, status: "shipped", date: "Yesterday", prescription: false },
  { id: "MED005", customer: "Suresh P.", items: "Chronic medicines (Rx)", total: 1250, status: "delivered", date: "2 days ago", prescription: true },
];

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PharmacyOrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, prescription: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setStats({
      total: mockOrders.length,
      pending: mockOrders.filter(o => o.status === "preparing" || o.status === "shipped").length,
      delivered: mockOrders.filter(o => o.status === "delivered").length,
      prescription: mockOrders.filter(o => o.prescription).length,
    });
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pharmacy" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Pharmacy Orders</h1>
          <p className="text-slate-500 text-sm">Manage medicine delivery orders</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL ORDERS</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">PENDING</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs font-bold">DELIVERED</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-xs font-bold">PRESCRIPTION</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.prescription}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer or order ID..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Status</option>
          <option value="preparing">Preparing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
          <p className="mt-4 font-bold">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Order ID</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Items</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Total</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Prescription</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{order.id}</td>
                  <td className="p-4 text-slate-600">{order.customer}</td>
                  <td className="p-4 text-slate-600 text-sm">{order.items}</td>
                  <td className="p-4 font-bold text-slate-800">₹{order.total}</td>
                  <td className="p-4">
                    {order.prescription && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Rx Required</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}