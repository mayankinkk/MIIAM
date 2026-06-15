"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const modules = [
  { id: "foods", title: "Foods", icon: "restaurant", color: "bg-[#ba001c]/10 text-[#ba001c]", route: "/admin/foods", type: "food" },
  { id: "grocery", title: "Grocery", icon: "shopping_basket", color: "bg-green-50 text-green-600", route: "/admin/grocery", type: "grocery" },
  { id: "printing", title: "Printing", icon: "print", color: "bg-indigo-50 text-indigo-600", route: "/admin/printing", type: "printing" },
  { id: "services", title: "Services", icon: "home_repair_service", color: "bg-blue-50 text-blue-600", route: "/admin/services", type: "services" },
];

const categoryColors: Record<string, string> = {
  food: "bg-[#ba001c]",
  grocery: "bg-green-500",
  printing: "bg-indigo-500",
  services: "bg-blue-500",
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    totalOrders: 0,
    activeVendors: 0,
    onlineRiders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    newUsersToday: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
  });
  const [categoryRevenue, setCategoryRevenue] = useState<Record<string, { revenue: number; orders: number }>>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentVendors, setRecentVendors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, vendorsRes, ridersRes, usersRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, placed_at, vendor_id").order("placed_at", { ascending: false }),
        supabase.from("vendors").select("id, shop_name, owner_name, type, status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("riders").select("id, status"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      const orders = ordersRes.data || [];
      const vendors = vendorsRes.data || [];
      const riders = ridersRes.data || [];
      const users = usersRes.data || [];

      const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const ordersToday = orders.filter((o: any) => new Date(o.placed_at) >= today).length;
      const pendingOrders = orders.filter((o: any) => ["pending", "accepted", "preparing", "ready_for_pickup", "on_the_way"].includes(o.status)).length;
      const cancelledOrders = orders.filter((o: any) => o.status === "cancelled").length;
      const activeVendors = vendors.filter((v: any) => v.status === "active").length;
      const onlineRiders = riders.filter((r: any) => r.status === "active").length;
      const totalUsers = users.length;
      const newUsersToday = users.filter((u: any) => new Date(u.created_at) >= today).length;
      const avgOrderValue = orders.filter((o: any) => o.status === "delivered").length > 0
        ? totalRevenue / orders.filter((o: any) => o.status === "delivered").length
        : 0;

      setStats({ totalRevenue, ordersToday, totalOrders: orders.length, activeVendors, onlineRiders, pendingOrders, totalUsers, newUsersToday, cancelledOrders, avgOrderValue });
      setRecentOrders(orders.slice(0, 8));
      setRecentVendors(vendors.slice(0, 8));

      // Build activity feed from recent orders
      const activity = orders.slice(0, 20).map((o: any) => ({
        id: o.id,
        type: o.status,
        message: `Order #${o.id.slice(0, 6).toUpperCase()} ${o.status}`,
        amount: o.total_amount,
        time: o.placed_at,
      }));
      setRecentActivity(activity);

      // Build vendor map for type lookup
      const vendorMap: Record<string, string> = {};
      vendors.forEach((v: any) => { vendorMap[v.id] = v.type || "food"; });

      // Calculate revenue by category
      const catRev: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach((o: any) => {
        const type = vendorMap[o.vendor_id] || "food";
        if (!catRev[type]) catRev[type] = { revenue: 0, orders: 0 };
        catRev[type].revenue += o.total_amount || 0;
        catRev[type].orders += 1;
      });
      setCategoryRevenue(catRev);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const maxCatRevenue = Math.max(...Object.values(categoryRevenue).map(c => c.revenue), 1);

  const getCategoryLabel = (type: string) => {
    const m = modules.find(mod => mod.type === type || (type === "flower" && mod.type === "flowers"));
    return m?.title || type;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Super Admin Dashboard</h1>
          <p className="text-[var(--color-outline)] text-sm mt-1">Real-time overview of MIIAM platform</p>
        </div>
        <button onClick={loadDashboardData} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]">
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-[#ba001c] to-[#ff7670] text-white p-5 rounded-2xl shadow-lg shadow-red-900/20 col-span-2">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-black mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-60 mt-1">{stats.totalOrders} total orders</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Orders Today</p>
              <p className="text-3xl font-black text-[var(--color-on-surface)] mt-2">{stats.ordersToday}</p>
              <p className="text-xs text-blue-500 mt-1">since midnight</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Pending</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{stats.pendingOrders}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">active orders</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Live Vendors</p>
              <p className="text-3xl font-black text-green-600 mt-2">{stats.activeVendors}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">active partners</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Riders</p>
              <p className="text-3xl font-black text-purple-600 mt-2">{stats.onlineRiders}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">active riders</p>
            </div>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">group</span>
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Total Users</p>
              </div>
              <p className="text-2xl font-black text-[var(--color-on-surface)]">{stats.totalUsers}</p>
              <p className="text-xs text-green-500 mt-1">+{stats.newUsersToday} today</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-green-500 text-lg">paid</span>
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Avg Order Value</p>
              </div>
              <p className="text-2xl font-black text-[var(--color-on-surface)]">₹{stats.avgOrderValue.toFixed(0)}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">per delivered order</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-red-500 text-lg">cancel</span>
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Cancelled</p>
              </div>
              <p className="text-2xl font-black text-red-600">{stats.cancelledOrders}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">{stats.totalOrders > 0 ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1) : 0}% cancellation rate</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-purple-500 text-lg">speed</span>
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Platform Health</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${stats.pendingOrders < 10 ? "bg-green-500" : stats.pendingOrders < 30 ? "bg-amber-500" : "bg-red-500"}`}></span>
                <p className="text-lg font-black text-[var(--color-on-surface)]">
                  {stats.pendingOrders < 10 ? "Good" : stats.pendingOrders < 30 ? "Busy" : "Overloaded"}
                </p>
              </div>
            </div>
          </div>

          {/* Category Revenue Breakdown */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
            <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Revenue by Category</h2>
            {Object.keys(categoryRevenue).length === 0 ? (
              <p className="text-[var(--color-outline-variant)] text-center py-8">No order data yet</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(categoryRevenue)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-bold text-[var(--color-on-surface)] capitalize">{getCategoryLabel(type)}</div>
                      <div className="flex-1 bg-[var(--color-surface-container)] rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${categoryColors[type] || "bg-slate-400"} rounded-full transition-all duration-500`}
                          style={{ width: `${(data.revenue / maxCatRevenue) * 100}%` }}
                        />
                      </div>
                      <div className="w-28 text-right">
                        <span className="font-bold text-[var(--color-on-surface)] text-sm">₹{data.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs text-[var(--color-outline-variant)]">{data.orders} orders</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity Feed */}
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-4">Recent Activity</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-[var(--color-outline-variant)] text-center py-8">No activity yet</p>
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <span className={`w-2 h-2 rounded-full ${
                        item.type === "delivered" ? "bg-green-500" :
                        item.type === "cancelled" ? "bg-red-500" :
                        item.type === "pending" ? "bg-amber-500" :
                        "bg-blue-500"
                      }`}></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{item.message}</p>
                        <p className="text-xs text-[var(--color-outline-variant)]">{new Date(item.time).toLocaleTimeString()}</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--color-on-surface)]">₹{item.amount?.toFixed(0) || 0}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[var(--color-on-surface)]">Recent Orders</h2>
                <button onClick={() => router.push("/admin/orders")} className="text-sm font-bold text-[#ba001c]">View All →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Order ID</th>
                      <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Amount</th>
                      <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Status</th>
                      <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]">
                        <td className="py-3 font-bold text-[var(--color-on-surface)]">{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3 font-bold text-[var(--color-on-surface)]">₹{order.total_amount?.toFixed(0)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            order.status === "delivered" ? "bg-green-100 text-green-700" :
                            order.status === "cancelled" ? "bg-red-100 text-red-700" :
                            order.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>{order.status}</span>
                        </td>
                        <td className="py-3 text-[var(--color-outline-variant)]">{new Date(order.placed_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Vendors */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[var(--color-on-surface)]">Recent Vendors</h2>
              <button onClick={() => router.push("/admin/vendors")} className="text-sm font-bold text-[#ba001c]">View All →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Shop Name</th>
                    <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Owner</th>
                    <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Category</th>
                    <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Status</th>
                    <th className="text-left py-3 text-xs font-bold text-[var(--color-outline-variant)] uppercase">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVendors.map(v => (
                    <tr key={v.id} className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]">
                      <td className="py-3 font-bold text-[var(--color-on-surface)]">{v.shop_name}</td>
                      <td className="py-3 text-[var(--color-on-surface-variant)]">{v.owner_name || "—"}</td>
                      <td className="py-3">
                        <span className="capitalize text-[var(--color-on-surface-variant)]">{v.type || "food"}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          v.status === "active" ? "bg-green-100 text-green-700" :
                          v.status === "pending" ? "bg-amber-100 text-amber-700" :
                          v.status === "suspended" ? "bg-red-100 text-red-700" :
                          "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                        }`}>{v.status}</span>
                      </td>
                      <td className="py-3 text-[var(--color-outline-variant)]">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentVendors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--color-outline-variant)]">No vendors yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module Navigation */}
          <div>
            <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-4">Manage Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(item.route)}
                  className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border-2 border-[var(--color-border-subtle)] shadow-sm hover:border-[#ba001c] hover:shadow-lg transition-all text-left group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-base font-black text-[var(--color-on-surface)]">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`w-2 h-2 rounded-full ${categoryColors[item.type] || "bg-slate-400"}`} />
                    <span className="text-xs text-[var(--color-outline-variant)]">
                      {categoryRevenue[item.type]
                        ? `₹${categoryRevenue[item.type].revenue.toLocaleString()} • ${categoryRevenue[item.type].orders} orders`
                        : "No orders yet"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
