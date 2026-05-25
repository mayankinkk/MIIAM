"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SponsoredItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: "active" | "paused" | "ended";
  impressions: number;
  clicks: number;
}

export default function SponsoredListingsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<SponsoredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("sponsored_listings").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as any);
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sponsored Listings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage vendor sponsored placements</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 font-medium py-12 animate-pulse">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300">campaign</span>
          <p className="text-slate-400 font-medium mt-3">No sponsored listings yet</p>
          <p className="text-xs text-slate-300 mt-1">Vendors can purchase sponsored placements from their dashboard</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Impressions</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clicks</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800 text-sm">{item.vendor_name}</td>
                  <td className="p-4 font-bold text-slate-800">₹{item.budget}</td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(item.start_date).toLocaleDateString()} – {new Date(item.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm font-bold">{item.impressions.toLocaleString()}</td>
                  <td className="p-4 text-sm font-bold">{item.clicks.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      item.status === "active" ? "bg-green-100 text-green-700" :
                      item.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                    }`}>{item.status}</span>
                  </td>
                  <td className="p-4">
                    <button className="text-xs font-bold text-[#ba001c] hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
