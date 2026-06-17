"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Link from "next/link";

const supabase = useMemo(() => createClient(), []);

interface GroceryOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  placed_at: string;
  profile?: any;
  order_items?: any[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  preparing: "bg-purple-100 text-purple-700",
  on_the_way: "bg-orange-100 text-orange-700",
  arrived: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "shopping", label: "Shopping" },
  { value: "picking_up", label: "Picking Up" },
  { value: "on_the_way", label: "On the Way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function GroceryOrdersPage() {
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, cancelled: 0 });
  const [selectedOrder, setSelectedOrder] = useState<GroceryOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profile:profiles(full_name, phone),
          order_items(*)
        `)
        .eq("vendor_type", "grocery")
        .order("placed_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      const stats = {
        total: data?.length || 0,
        pending: data?.filter((o: { status: string }) => ["pending", "accepted", "preparing"].includes(o.status)).length || 0,
        completed: data?.filter((o: { status: string }) => o.status === "delivered").length || 0,
        cancelled: data?.filter((o: { status: string }) => o.status === "cancelled").length || 0,
      };
      setStats(stats);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      useToastStore.getState().addToast("Failed to update order status", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/grocery" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Grocery Orders</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage and track all grocery delivery orders</p>
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
          <p className="text-green-600 text-xs font-bold">COMPLETED</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.completed}</p>
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
            placeholder="Search by order ID or customer name..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="all">All Status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-outline)]">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
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
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Status</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Date</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]">
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-on-surface)]">{order.profile?.full_name || "Customer"}</div>
                    <div className="text-xs text-[var(--color-outline)]">{order.profile?.phone || "N/A"}</div>
                  </td>
                  <td className="p-4 text-[var(--color-on-surface-variant)]">
                    {order.order_items?.length || 0} items
                  </td>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">₹{order.total_amount?.toFixed(0)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-outline)] text-sm">{formatDate(order.placed_at || order.created_at)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-[var(--color-primary)] font-bold text-sm hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-[var(--color-surface-container-lowest)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[var(--color-on-surface)]">Order Details</h2>
                  <p className="text-[var(--color-outline)] text-sm">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                  <p className="text-xs text-[var(--color-outline)] mb-1">Customer</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedOrder.profile?.full_name || "N/A"}</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{selectedOrder.profile?.phone || "N/A"}</p>
                </div>
                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                  <p className="text-xs text-[var(--color-outline)] mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-[var(--color-primary)]">₹{selectedOrder.total_amount?.toFixed(0)}</p>
                </div>
              </div>

              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                <p className="text-xs text-[var(--color-outline)] mb-1">Delivery Address</p>
                <p className="font-medium text-[var(--color-on-surface)]">{selectedOrder.delivery_address || "N/A"}</p>
              </div>

              <div>
                <p className="font-bold text-[var(--color-on-surface)] mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateOrderStatus(selectedOrder.id, opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedOrder.status === opt.value
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-[var(--color-on-surface)] mb-3">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-lg">
                      <div>
                        <p className="font-medium text-[var(--color-on-surface)]">{item.name || "Item"}</p>
                        <p className="text-sm text-[var(--color-outline)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[var(--color-on-surface)]">₹{item.price?.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}