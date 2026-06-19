"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";


const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-700",
};

interface PharmacyOrderItem { name: string; quantity: number; }
interface PharmacyOrderRaw {
  id: string;
  total_amount: number | null;
  status: string | null;
  placed_at: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  order_items: PharmacyOrderItem[] | null;
}

interface PharmacyOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: string;
  date: string;
  prescription: boolean;
}

export default function PharmacyOrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, prescription: 0 });
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
      .select("id, total_amount, status, placed_at, delivery_address, special_instructions, order_items(name, quantity)")
      .eq("vendor_type", "pharmacy")
      .order("placed_at", { ascending: false })
      .limit(50);

    if (data) {
      const mapped: PharmacyOrder[] = (data as PharmacyOrderRaw[]).map((o) => ({
        id: o.id,
        customer: o.delivery_address?.split(",")[0] || "Customer",
        items: o.order_items?.map((i) => `${i.name} (x${i.quantity})`).join(", ") || "N/A",
        total: o.total_amount || 0,
        status: o.status || "pending",
        date: o.placed_at ? new Date(o.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "",
        prescription: o.special_instructions?.toLowerCase().includes("prescription") || false,
      }));
      setOrders(mapped);
      setStats({
        total: mapped.length,
        pending: mapped.filter(o => o.status === "preparing" || o.status === "shipped" || o.status === "pending").length,
        delivered: mapped.filter(o => o.status === "delivered").length,
        prescription: mapped.filter(o => o.prescription).length,
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
        <Link href="/admin/pharmacy" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Pharmacy Orders</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage medicine delivery orders</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-xs font-bold">TOTAL ORDERS</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)] mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
          <p className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">PENDING</p>
          <p className="text-2xl font-black text-yellow-700 dark:text-yellow-300 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/30">
          <p className="text-green-600 dark:text-green-400 text-xs font-bold">DELIVERED</p>
          <p className="text-2xl font-black text-green-700 dark:text-green-300 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
          <p className="text-blue-600 dark:text-blue-400 text-xs font-bold">PRESCRIPTION</p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{stats.prescription}</p>
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
            aria-label="Search pharmacy orders"
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
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
            <caption className="sr-only">Pharmacy Orders</caption>
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Order ID</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Customer</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Items</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Total</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Prescription</th>
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
                    {order.prescription && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-bold">Rx Required</span>
                    )}
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