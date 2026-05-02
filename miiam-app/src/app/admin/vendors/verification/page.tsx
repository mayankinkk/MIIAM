"use client";

import { useState } from "react";

interface VendorApplication {
  id: string;
  name: string;
  owner: string;
  phone: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  documents: number;
}

const sampleApplications: VendorApplication[] = [
  { id: "V001", name: "Tandoor Palace", owner: "Raj Kumar", phone: "+91 98765 43210", category: "Food", status: "pending", submittedAt: "2024-04-23", documents: 5 },
  { id: "V002", name: "Healthy Bowl", owner: "Priya Sharma", phone: "+91 87654 32109", category: "Food", status: "pending", submittedAt: "2024-04-22", documents: 4 },
  { id: "V003", name: "Clean Pro Services", owner: "Anil Gupta", phone: "+91 76543 21098", category: "Services", status: "pending", submittedAt: "2024-04-21", documents: 6 },
  { id: "V004", name: "Desi Daadi", owner: "Meera Singh", phone: "+91 65432 10987", category: "Food", status: "rejected", submittedAt: "2024-04-20", documents: 3 },
  { id: "V005", name: "TechFix Hub", owner: "Kunal Patel", phone: "+91 54321 09876", category: "Services", status: "approved", submittedAt: "2024-04-19", documents: 5 },
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function VerificationPage() {
  const [filter, setFilter] = useState("all");

  const filtered = sampleApplications.filter(a => 
    filter === "all" || a.status === filter
  );

  const pendingCount = sampleApplications.filter(a => a.status === "pending").length;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Vendor Verifications</h1>
          <p className="text-slate-400 text-sm">Review partner applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pending Review</p>
          <p className="text-3xl font-black text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Approved Today</p>
          <p className="text-3xl font-black text-green-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Rejected Today</p>
          <p className="text-3xl font-black text-red-600">2</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Avg Response Time</p>
          <p className="text-3xl font-black text-slate-800">4.2h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
              filter === status
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Applications */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Application</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Owner</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Category</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Documents</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Submitted</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Status</th>
              <th className="p-4 text-xs font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{app.name}</p>
                  <p className="text-xs text-slate-400">{app.id}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-800">{app.owner}</p>
                  <p className="text-xs text-slate-400">{app.phone}</p>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium text-slate-600">{app.category}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">description</span>
                    <span className="text-sm text-slate-600">{app.documents} files</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{app.submittedAt}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${statusColors[app.status]}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-4">
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
                        Reject
                      </button>
                      <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
                        View
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}