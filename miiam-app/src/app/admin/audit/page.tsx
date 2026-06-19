"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export default function AuditLogs() {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      
      if (filter !== "all") {
        query = query.eq("action", filter);
      }
      if (search) {
        query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%`);
      }

      const { data } = await query;
      if (data) setLogs(data);
      setLoading(false);
    }

    fetchLogs();

    const channel = supabase.channel("audit-logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, filter, search]);

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
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(l.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  if (loading) return <div className="px-8 text-[var(--color-on-surface)]">Loading audit logs...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Audit Logs</h1>
          <p className="text-[var(--color-outline)]">Track all admin actions and platform changes.</p>
        </div>
        <button 
          onClick={() => { exportLogs(); useToastStore.getState().addToast("Audit logs exported", "success"); }}
          className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300 px-6 py-3 rounded-xl font-bold hover:bg-green-100 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export CSV
        </button>
      </div>

      {/* Action Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(actionStats).map(([action, count]) => (
          <div key={action} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
            <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase truncate">{action}</p>
            <p className="text-2xl font-black text-[var(--color-on-surface)]">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-4 shadow-sm">
        <div className="flex gap-4 flex-wrap items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter by action type"
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="order">Order</option>
            <option value="payment">Payment</option>
            <option value="settings_change">Settings Change</option>
            <option value="vendor_action">Vendor Action</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="logout">Logout</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter from date"
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter to date"
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
          />
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--color-outline-variant)] text-sm">search</span>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search audit logs"
              className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Timestamp</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Admin</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Action</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Target</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[var(--color-surface-subtle)]/50">
                  <td className="p-4 text-xs text-[var(--color-outline)] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-IN", { 
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-[var(--color-on-surface-variant)]">{log.admin_id?.slice(0, 8) || "system"}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                      log.action === "create" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      log.action === "update" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      log.action === "delete" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">{log.target_type}</span>
                    <span className="font-mono text-xs text-[var(--color-outline-variant)] ml-2">{log.target_id?.slice(0, 8)}</span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <span className="text-xs text-[var(--color-outline)] truncate block">
                      {JSON.stringify(log.details || {}).slice(0, 50)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-[var(--color-outline-variant)]">
            <span className="material-symbols-outlined text-4xl mb-3 block">policy</span>
            <p className="font-bold text-[var(--color-on-surface-variant)]">No audit logs found</p>
            <p className="text-sm mt-1">Adjust filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}