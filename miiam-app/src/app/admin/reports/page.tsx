"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ReportType = "orders" | "revenue" | "vendors" | "riders" | "users";

interface OrderRow {
  id: string;
  vendor_name: string;
  customer_name: string;
  status: string;
  total_amount: number;
  placed_at: string;
}

interface VendorRow {
  name: string;
  orders: number;
  revenue: number;
  rating: number;
}

interface RiderRow {
  name: string;
  deliveries: number;
  hours: number;
  rating: number;
  earnings: number;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [revenue, setRevenue] = useState({ gross: 0, net: 0, platformFee: 0, refunds: 0 });
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, newThisMonth: 0, active: 0 });

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] });
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    const startIso = dateRange.start ? new Date(dateRange.start).toISOString() : new Date(0).toISOString();
    const endIso = dateRange.end ? new Date(dateRange.end + "T23:59:59").toISOString() : new Date().toISOString();

    try {
      if (reportType === "orders") {
        const { data } = await supabase
          .from("orders")
          .select("id, status, total_amount, placed_at, vendor:vendors(name), user:user_id(full_name, phone)")
          .gte("placed_at", startIso)
          .lte("placed_at", endIso)
          .order("placed_at", { ascending: false })
          .limit(100);
        if (data) {
          setOrders(data.map((o: any) => ({
            id: o.id.slice(0, 8).toUpperCase(),
            vendor_name: o.vendor?.name || "—",
            customer_name: o.user?.full_name || o.user?.phone || "—",
            status: o.status,
            total_amount: o.total_amount || 0,
            placed_at: o.placed_at,
          })));
          setTotalOrderCount(data.length);
        }
      } else if (reportType === "revenue") {
        const { data } = await supabase
          .from("orders")
          .select("total_amount, status, discount_amount")
          .gte("placed_at", startIso)
          .lte("placed_at", endIso);
        if (data) {
          const gross = data.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
          const refunds = data.filter((o: any) => o.status === "refunded").reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
          const discounts = data.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0);
          const platformFee = Math.round(gross * 0.15);
          setRevenue({ gross, net: gross - refunds - discounts, platformFee, refunds });
        }
      } else if (reportType === "vendors") {
        const { data } = await supabase
          .from("orders")
          .select("vendor_id, total_amount, vendor:vendors(id, name)")
          .gte("placed_at", startIso)
          .lte("placed_at", endIso);
        if (data) {
          const vendorMap = new Map<string, { name: string; orders: number; revenue: number }>();
          for (const o of data) {
            const vid = o.vendor_id;
            const vName = (o as any).vendor?.name || "Unknown";
            const cur = vendorMap.get(vid) || { name: vName, orders: 0, revenue: 0 };
            cur.orders++;
            cur.revenue += o.total_amount || 0;
            vendorMap.set(vid, cur);
          }
          const vendorList = Array.from(vendorMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 20);
          setVendors(vendorList.map(v => ({ ...v, rating: 0 })));
        }
      } else if (reportType === "riders") {
        const { data } = await supabase
          .from("orders")
          .select("rider_id, total_amount, status, rider:riders(id, full_name, phone)")
          .eq("status", "delivered")
          .gte("placed_at", startIso)
          .lte("placed_at", endIso);
        if (data) {
          const riderMap = new Map<string, { name: string; deliveries: number; earnings: number }>();
          for (const o of data) {
            const rid = o.rider_id;
            if (!rid) continue;
            const rName = (o as any).rider?.full_name || (o as any).rider?.phone || "Unknown";
            const cur = riderMap.get(rid) || { name: rName, deliveries: 0, earnings: 0 };
            cur.deliveries++;
            cur.earnings += o.total_amount || 0;
            riderMap.set(rid, cur);
          }
          const riderList = Array.from(riderMap.values())
            .sort((a, b) => b.deliveries - a.deliveries)
            .slice(0, 20);
          setRiders(riderList.map(r => ({ ...r, hours: 0, rating: 0 })));
        }
      } else if (reportType === "users") {
        const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { count: newThisMonth } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString());
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { count: active } = await supabase
          .from("orders")
          .select("user_id", { count: "exact", head: true })
          .gte("placed_at", thirtyDaysAgo);
        setUserStats({ total: total || 0, newThisMonth: newThisMonth || 0, active: active || 0 });
      }
    } catch (e) {
      console.error("[reports] Failed to load report:", e);
    }
    setLoading(false);
  }, [reportType, dateRange]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) loadReport();
  }, [loadReport, dateRange]);

  const exportCsv = () => {
    let rows: string[][] = [];
    let headers: string[] = [];
    if (reportType === "orders") {
      headers = ["Order ID", "Vendor", "Customer", "Status", "Total", "Date"];
      rows = orders.map(o => [o.id, o.vendor_name, o.customer_name, o.status, String(o.total_amount), new Date(o.placed_at).toLocaleDateString("en-IN")]);
    } else if (reportType === "vendors") {
      headers = ["Vendor", "Orders", "Revenue", "Rating"];
      rows = vendors.map(v => [v.name, String(v.orders), String(v.revenue), String(v.rating)]);
    } else if (reportType === "riders") {
      headers = ["Rider", "Deliveries", "Earnings"];
      rows = riders.map(r => [r.name, String(r.deliveries), String(r.earnings)]);
    } else if (reportType === "users") {
      headers = ["Metric", "Value"];
      rows = [["Total Users", String(userStats.total)], ["New This Month", String(userStats.newThisMonth)], ["Active Users (30d)", String(userStats.active)]];
    } else if (reportType === "revenue") {
      headers = ["Metric", "Value (₹)"];
      rows = [["Gross Revenue", String(revenue.gross)], ["Net Revenue", String(revenue.net)], ["Platform Fee", String(revenue.platformFee)], ["Refunds", String(revenue.refunds)]];
    }
    const escape = (v: string) => v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    { id: "orders" as ReportType, label: "Orders", icon: "shopping_cart", description: "All order transactions" },
    { id: "revenue" as ReportType, label: "Revenue", icon: "payments", description: "Financial summary" },
    { id: "vendors" as ReportType, label: "Vendors", icon: "storefront", description: "Partner performance" },
    { id: "riders" as ReportType, label: "Riders", icon: "two_wheeler", description: "Delivery metrics" },
    { id: "users" as ReportType, label: "Users", icon: "group", description: "User analytics" },
  ];

  const statusColors: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-slate-100 text-slate-700",
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-indigo-100 text-indigo-700",
    on_the_way: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Reports</h1>
        <p className="text-slate-400 text-sm">Generate and export platform reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`p-6 rounded-2xl text-left transition-all ${
              reportType === type.id
                ? "bg-[#ba001c] text-white shadow-lg shadow-red-900/20"
                : "bg-[var(--color-surface-container-lowest)] border border-slate-100 hover:border-slate-200"
            }`}
          >
            <span className={`material-symbols-outlined text-2xl mb-3 ${reportType === type.id ? "text-white" : "text-slate-400"}`}>{type.icon}</span>
            <p className="font-bold">{type.label}</p>
            <p className={`text-xs ${reportType === type.id ? "text-white/70" : "text-slate-400"}`}>{type.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Date Range</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Date</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">End Date</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
          </div>
          <div className="flex gap-2">
            {[{ label: "Today", days: 0 }, { label: "7D", days: 7 }, { label: "30D", days: 30 }, { label: "90D", days: 90 }].map((preset) => (
              <button key={preset.label} onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - preset.days); setDateRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] }); }} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200">
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {reportType === "orders" && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Orders Report</h3>
                <button onClick={exportCsv} className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
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
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400">No orders found for this date range</td></tr>
                    ) : orders.map((order) => (
                      <tr key={order.id}>
                        <td className="p-4 font-bold text-slate-800">{order.id}</td>
                        <td className="p-4 text-sm text-slate-600">{order.vendor_name}</td>
                        <td className="p-4 text-sm text-slate-600">{order.customer_name}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">₹{order.total_amount.toLocaleString("en-IN")}</td>
                        <td className="p-4 text-sm text-slate-600">{new Date(order.placed_at).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 text-center text-xs text-slate-400">Showing {orders.length} orders</div>
            </div>
          )}

          {reportType === "revenue" && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Revenue Report</h3>
                <button onClick={exportCsv} className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">₹{revenue.gross.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Net Revenue</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">₹{revenue.net.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Platform Fee (15%)</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">₹{revenue.platformFee.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Refunds</p>
                  <p className="text-2xl font-black text-red-600 mt-2">₹{revenue.refunds.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          )}

          {reportType === "vendors" && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Vendor Performance Report</h3>
                <button onClick={exportCsv} className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Vendor</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Orders</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Revenue</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vendors.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No vendor data for this date range</td></tr>
                  ) : vendors.map((vendor) => (
                    <tr key={vendor.name}>
                      <td className="p-4 font-bold text-slate-800">{vendor.name}</td>
                      <td className="p-4 text-sm text-slate-600">{vendor.orders}</td>
                      <td className="p-4 font-bold text-slate-800">₹{vendor.revenue.toLocaleString("en-IN")}</td>
                      <td className="p-4 text-sm text-slate-600">₹{vendor.orders > 0 ? Math.round(vendor.revenue / vendor.orders).toLocaleString("en-IN") : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === "riders" && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Rider Performance Report</h3>
                <button onClick={exportCsv} className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Rider</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Deliveries</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Earnings</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase">Avg per Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {riders.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No rider data for this date range</td></tr>
                  ) : riders.map((rider) => (
                    <tr key={rider.name}>
                      <td className="p-4 font-bold text-slate-800">{rider.name}</td>
                      <td className="p-4 text-sm text-slate-600">{rider.deliveries}</td>
                      <td className="p-4 font-bold text-slate-800">₹{rider.earnings.toLocaleString("en-IN")}</td>
                      <td className="p-4 text-sm text-slate-600">₹{rider.deliveries > 0 ? Math.round(rider.earnings / rider.deliveries).toLocaleString("en-IN") : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === "users" && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">User Analytics Report</h3>
                <button onClick={exportCsv} className="px-4 py-2 bg-[#ba001c] rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">download</span> Export CSV
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Users</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">{userStats.total.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">New This Month</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">{userStats.newThisMonth.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Active (30d)</p>
                  <p className="text-2xl font-black text-slate-800 mt-2">{userStats.active.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
