"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = useMemo(() => createClient(), []);

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-700",
};

const typeColors: Record<string, string> = {
  bouquet: "bg-rose-100 text-rose-700",
  arrangement: "bg-purple-100 text-purple-700",
  combo: "bg-pink-100 text-pink-700",
  hamper: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

interface FlowerOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: string;
  date: string;
  type: string;
}

export default function FlowersOrdersPage() {
  const [orders, setOrders] = useState<FlowerOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, cancelled: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, total_amount, status, placed_at, delivery_address, order_items(name, quantity)")
      .eq("vendor_type", "flowers")
      .order("placed_at", { ascending: false })
      .limit(50);

    if (data) {
      const mapped: FlowerOrder[] = data.map((o: any) => ({
        id: o.id,
        customer: o.delivery_address?.split(",")[0] || "Customer",
        items: o.order_items?.map((i: any) => `${i.name} (x${i.quantity})`).join(", ") || "N/A",
        total: o.total_amount || 0,
        status: o.status || "pending",
        date: o.placed_at ? new Date(o.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "",
        type: "bouquet",
      }));
      setOrders(mapped);
      setStats({
        total: mapped.length,
        pending: mapped.filter(o => o.status === "preparing" || o.status === "shipped" || o.status === "pending").length,
        delivered: mapped.filter(o => o.status === "delivered").length,
        cancelled: mapped.filter(o => o.status === "cancelled").length,
      });
    }
    setLoading(false);
  }

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
        <Link href="/admin/flowers" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Flowers Orders</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage flower delivery orders</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-xs font-bold">TOTAL ORDERS</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)] mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">PENDING</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs font-bold">DELIVERED</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">CANCELLED</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer or order ID..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="all">All Status</option>
          <option value="preparing">Preparing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)] bg-[var(--color-surface-container-lowest)] rounded-xl">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">receipt_long</span>
          <p className="mt-4 font-bold">No orders found</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Order ID</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Customer</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Items</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Total</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Type</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Status</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">{order.id}</td>
                  <td className="p-4 text-[var(--color-on-surface-variant)]">{order.customer}</td>
                  <td className="p-4 text-[var(--color-on-surface-variant)] text-sm">{order.items}</td>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">₹{order.total}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${typeColors[order.type]}`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-outline)] text-sm">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}