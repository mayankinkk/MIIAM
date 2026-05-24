"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

interface VendorInfo {
  id: string;
  shop_name: string;
  status: string;
  rating: number;
  review_count: number;
  type?: string;
}

export default function VendorDashboard() {
  const supabase = createClient();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: v } = await supabase
      .from("vendors")
      .select("id, shop_name, status, rating, review_count, type")
      .eq("user_id", user.id)
      .maybeSingle();
    if (v) {
      setVendor(v);
      setIsOpen(v.status === "active");
      loadOrders(v.id);
    }
    setLoading(false);
  }

  async function loadOrders(vendorId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*, menu_item:menu_items(name))")
      .eq("vendor_id", vendorId)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
  }

  const toggleOpen = async () => {
    if (!vendor) return;
    const newStatus = isOpen ? "inactive" : "active";
    await supabase.from("vendors").update({ status: newStatus }).eq("id", vendor.id);
    setIsOpen(!isOpen);
  };

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.placed_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayRevenue = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const todayItemsSold = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">No Vendor Found</h2>
        <p className="text-slate-500 mb-6">You don't have a vendor account yet. Register to start selling.</p>
        <Link
          href="/partner/register"
          className="bg-[#ba001c] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#a40017] transition-colors"
        >
          Register Your Store
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vendor Dashboard</h1>
          <p className="text-slate-500 mt-1">{vendor.shop_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOpen}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isOpen
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}></span>
            {isOpen ? "Open for Orders" : "Closed"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-slate-400">receipt_long</span>
            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
              {todayOrders.length > 0 ? "+" + todayOrders.length : "0"} today
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900">{todayOrders.length}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">Today's Orders</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-slate-400">paid</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₹{todayRevenue.toFixed(0)}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">Today's Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <span className="text-xs text-slate-400 font-medium">{vendor.review_count} reviews</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{vendor.rating.toFixed(1)}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">Average Rating</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-slate-400">inventory_2</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{todayItemsSold}</p>
          <p className="text-sm text-slate-500 font-medium mt-1">Items Sold Today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              Pending Orders
              {pendingOrders.length > 0 && (
                <span className="bg-[#ba001c] text-white text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
              )}
            </h2>
            <Link href="/partner/orders" className="text-sm font-bold text-[#ba001c] hover:underline">
              View All
            </Link>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">check_circle</span>
              <p className="text-slate-400 font-medium">No pending orders</p>
              <p className="text-slate-300 text-sm mt-1">New orders will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 uppercase">
                        {order.status}
                      </span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-sm text-slate-600">
                        <span className="font-bold text-slate-400 mr-1">{item.quantity}x</span>
                        {item.menu_item?.name || "Item"}
                      </p>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <p className="text-xs text-slate-400">+{order.items!.length - 3} more items</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="font-extrabold text-lg text-[#ba001c]">₹{order.total_amount.toFixed(2)}</p>
                    <Link
                      href="/partner"
                      className="text-sm font-bold text-[#ba001c] hover:underline"
                    >
                      Process in POS →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/partner/menu"
                className="bg-slate-50 p-4 rounded-xl text-center hover:bg-[#ffe1e4] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-[#ba001c]">restaurant_menu</span>
                <p className="text-xs font-bold text-slate-600 group-hover:text-[#ba001c] mt-1">Manage Menu</p>
              </Link>
              <Link
                href="/partner/analytics"
                className="bg-slate-50 p-4 rounded-xl text-center hover:bg-[#ffe1e4] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-[#ba001c]">analytics</span>
                <p className="text-xs font-bold text-slate-600 group-hover:text-[#ba001c] mt-1">View Analytics</p>
              </Link>
              <Link
                href="/partner/wallet"
                className="bg-slate-50 p-4 rounded-xl text-center hover:bg-[#ffe1e4] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-[#ba001c]">account_balance_wallet</span>
                <p className="text-xs font-bold text-slate-600 group-hover:text-[#ba001c] mt-1">Wallet</p>
              </Link>
              <Link
                href="/partner/profile"
                className="bg-slate-50 p-4 rounded-xl text-center hover:bg-[#ffe1e4] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-[#ba001c]">store</span>
                <p className="text-xs font-bold text-slate-600 group-hover:text-[#ba001c] mt-1">Store Settings</p>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Recent Orders</h3>
              <Link href="/partner/orders" className="text-xs font-bold text-[#ba001c]">See All</Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-slate-700">#{order.id.slice(0, 6).toUpperCase()}</p>
                      <p className="text-xs text-slate-400">{new Date(order.placed_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{order.total_amount.toFixed(0)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
