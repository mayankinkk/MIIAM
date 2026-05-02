"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export default function AdminFoodsDashboard() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from("orders")
        .select("*, vendor:vendors(name)")
        .order("placed_at", { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const totalGMV = orders.reduce((acc, curr) => acc + curr.total_amount, 0);
  const activeOrders = orders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status)).length;

  if (loading) return <div className="px-8">Loading foods dashboard...</div>;

  return (
    <div className="px-8 space-y-12">
      <h1 className="text-3xl font-black text-slate-800">Foods Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total GMV", value: `₹${totalGMV.toLocaleString()}`, trend: "+12.5%", icon: "payments", color: "text-green-600" },
          { label: "Active Orders", value: activeOrders, trend: "Live", icon: "shopping_cart", color: "text-[#ba001c]" },
          { label: "Partner Count", value: "24", trend: "+2 this week", icon: "store", color: "text-blue-600" },
          { label: "Customer Satisfaction", value: "4.8/5", trend: "+0.1", icon: "thumb_up", color: "text-amber-500" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${kpi.color}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Food Orders Feed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 font-bold">#{order.id.slice(0, 6)}</td>
                    <td className="p-4 text-slate-500">{order.vendor?.name || "Unknown"}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">₹{order.total_amount.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-3xl p-6 text-white shadow-lg shadow-red-900/20">
            <h3 className="font-bold text-lg mb-2">Foods Alert</h3>
            <p className="text-white/80 text-sm mb-4">5 partners in North Delhi are reporting high latency in order acceptance.</p>
            <button className="w-full py-3 bg-white text-[#ba001c] rounded-xl font-black text-xs hover:bg-opacity-90 transition-all uppercase tracking-widest">
              View Map
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Support Queue</h3>
            <div className="space-y-4">
              {[
                { name: "John Doe", issue: "Payment Failed", time: "2m ago" },
                { name: "Sarah Smith", issue: "Order Missing Item", time: "15m ago" },
                { name: "Mike Ross", issue: "Rider Late", time: "1h ago" },
              ].map((ticket, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{ticket.name}</p>
                    <p className="text-[10px] text-slate-400">{ticket.issue}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{ticket.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}