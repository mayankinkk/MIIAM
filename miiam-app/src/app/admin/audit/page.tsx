"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

export default function AuditLogs() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
    const channel = supabase.channel("audit-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => loadLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, filter]);

  async function loadLogs() {
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    
    if (filter !== "all") {
      query = query.eq("action", filter);
    }
    
    const { data } = await query;
    if (data) setLogs(data);
    setLoading(false);
  }

  async function exportLogs() {
    const headers = ["Timestamp", "Admin ID", "Action", "Target Type", "Target ID", "Details"];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.admin_id?.slice(0, 8) || "system",
      l.action,
      l.target_type,
      l.target_id?.slice(0, 8),
      JSON.stringify(l.details || {})
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const actionStats = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredLogs = logs.filter(l => {
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && 
        !l.target_id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="px-8">Loading audit logs...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Audit Logs</h1>
          <p className="text-slate-500">Track all admin actions and platform changes.</p>
        </div>
        <button 
          onClick={exportLogs}
          className="bg-green-50 text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-100 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export CSV
        </button>
      </div>

      {/* Action Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(actionStats).map(([action, count]) => (
          <div key={action} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase truncate">{action}</p>
            <p className="text-2xl font-black text-slate-800">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-IN", { 
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-slate-600">{log.admin_id?.slice(0, 8) || "system"}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                      log.action === "create" ? "bg-green-100 text-green-700" :
                      log.action === "update" ? "bg-blue-100 text-blue-700" :
                      log.action === "delete" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-slate-800">{log.target_type}</span>
                    <span className="font-mono text-xs text-slate-400 ml-2">{log.target_id?.slice(0, 8)}</span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <span className="text-xs text-slate-500 truncate block">
                      {JSON.stringify(log.details || {}).slice(0, 50)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No audit logs found
          </div>
        )}
      </div>
    </div>
  );
}