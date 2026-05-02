"use client";

import { useEffect, useState } from "react";

const serviceDetails: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  ac: { label: "AC Repair", icon: "ac_unit", color: "text-blue-500", bg: "bg-blue-50" },
  plumbing: { label: "Plumbing", icon: "plumbing", color: "text-cyan-500", bg: "bg-cyan-50" },
  electrical: { label: "Electrical", icon: "electrical_services", color: "text-amber-500", bg: "bg-amber-50" },
  cleaning: { label: "Cleaning", icon: "cleaning_services", color: "text-green-500", bg: "bg-green-50" },
  appliance: { label: "Appliance", icon: "kitchen", color: "text-purple-500", bg: "bg-purple-50" },
  pest: { label: "Pest Control", icon: "bug_report", color: "text-red-500", bg: "bg-red-50" },
};

interface ServiceData {
  id: string;
  service: string;
  status: string;
  amount: number;
  customer: string;
  date: string;
}

export default function AdminServiceDetail({ params }: { params: { service: string } }) {
  const service = serviceDetails[params.service] || serviceDetails["pest"];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const mockData: ServiceData[] = [
    { id: "PST001", service: "Pest Control", status: "completed", amount: 800, customer: "John Doe", date: "2 hours ago" },
    { id: "PST002", service: "Pest Control", status: "in_progress", amount: 1200, customer: "Sarah Smith", date: "4 hours ago" },
    { id: "PST003", service: "Pest Control", status: "pending", amount: 600, customer: "Mike Ross", date: "1 day ago" },
    { id: "PST004", service: "Pest Control", status: "completed", amount: 1500, customer: "Anna Lee", date: "1 day ago" },
    { id: "PST005", service: "Pest Control", status: "cancelled", amount: 500, customer: "Tom Hardy", date: "2 days ago" },
  ];

  if (loading) return <div className="px-8">Loading...</div>;

  return (
    <div className="px-8 space-y-12">
      <h1 className="text-3xl font-black text-slate-800">{service.label} Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Bookings", value: "156", trend: "+12%", icon: "assignment", color: service.color },
          { label: "Revenue", value: "₹2,45,000", trend: "+8.5%", icon: "payments", color: "text-green-600" },
          { label: "Active Providers", value: "18", trend: "+2", icon: "people", color: "text-purple-600" },
          { label: "Completion Rate", value: "94%", trend: "+2%", icon: "check_circle", color: "text-amber-500" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${kpi.color}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-600">
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
            <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">{service.label} Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium">
                {mockData.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 font-bold">#{booking.id}</td>
                    <td className="p-4 text-slate-500">{booking.customer}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">₹{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${service.color.replace('text-', 'from-')} to-blue-400 rounded-3xl p-6 text-white shadow-lg`}>
            <h3 className="font-bold text-lg mb-2">{service.label} Stats</h3>
            <p className="text-white/80 text-sm mb-4">View detailed analytics for {service.label.toLowerCase()} services.</p>
            <button className="w-full py-3 bg-white rounded-xl font-black text-xs hover:bg-opacity-90 transition-all uppercase tracking-widest">
              View Analytics
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Top Providers</h3>
            <div className="space-y-3">
              {[
                { name: "Rajesh Kumar", rating: "4.9", jobs: 45 },
                { name: "Amit Singh", rating: "4.8", jobs: 38 },
                { name: "Praveen Sharma", rating: "4.7", jobs: 32 },
              ].map((provider, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className={`w-10 h-10 rounded-full ${service.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-lg ${service.color}`}>person</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{provider.name}</p>
                    <p className="text-[10px] text-slate-400">{provider.jobs} jobs - {provider.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}