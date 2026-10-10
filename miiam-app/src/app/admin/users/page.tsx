"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ProfileSkeleton } from "@/components/Skeleton";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

const PAGE_SIZE = 15;

export default function UserRegistry() {
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadProfiles();

    const channel = supabase
      .channel("profiles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, searchQuery]);

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFrom && p.created_at && new Date(p.created_at) < new Date(dateFrom)) return false;
    if (dateTo && p.created_at && new Date(p.created_at) > new Date(dateTo + "T23:59:59"))
      return false;
    return true;
  });

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = async (action: string, profile: Profile) => {
    setOpenMenuId(null);
    if (action === "view") {
      setSelectedProfile(profile);
      setShowDetailModal(true);
    } else if (action === "edit") {
      setSelectedProfile(profile);
      setShowRoleModal(true);
    } else if (action === "delete") {
      if (
        await confirm({
          title: "Delete",
          message: `Are you sure you want to delete ${profile.full_name}?`,
          variant: "danger",
        })
      ) {
        await supabase.from("profiles").delete().eq("id", profile.id);
        loadProfiles();
      }
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (searchQuery.trim()) {
      const { data, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .range(from, to)
        .order("created_at", { ascending: false });
      if (data) setProfiles(data);
      setTotalCount(count || 0);
    } else {
      const [{ data, count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .range(from, to)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      if (data) setProfiles(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function toggleSelectAll() {
    if (selectedIds.size === filteredProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exportToCSV() {
    const headers = ["Name", "Email", "Role", "Join Date", "ID"];
    const rows = filteredProfiles
      .filter((p) => selectedIds.size === 0 || selectedIds.has(p.id))
      .map((p) => [
        p.full_name || "",
        p.email || "",
        p.role || "",
        p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "",
        p.id,
      ]);
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function bulkSuspend() {
    if (
      !(await confirm({
        title: "Bulk Suspend",
        message: `Suspend ${selectedIds.size} users?`,
        variant: "danger",
      }))
    )
      return;
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        supabase.from("profiles").update({ role: "suspended" }).eq("id", id)
      )
    );
    useToastStore.getState().addToast(`${selectedIds.size} users suspended`, "success");
    setSelectedIds(new Set());
    loadProfiles();
  }

  if (loading)
    return (
      <div className="space-y-8 px-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-2 h-10 w-48 animate-pulse rounded bg-[var(--color-surface-container-high)]" />
            <div className="h-5 w-72 animate-pulse rounded bg-[var(--color-surface-container-high)]" />
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-surface-container-high)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-container-high)]" />
                  <div className="h-3 w-48 animate-pulse rounded bg-[var(--color-surface-container-high)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            User Registry
          </h1>
          <p className="text-[var(--color-outline)]">
            Manage all customer and staff accounts across MIIAM.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-50 p-6">
          <div className="flex max-w-sm flex-1 items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2">
            <span className="material-symbols-outlined text-sm text-[var(--color-outline-variant)]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or ID..."
              aria-label="Search users"
              className="w-full border-none bg-transparent text-sm focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter users from join date"
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2 text-sm focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter users to join date"
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs font-bold text-[var(--color-outline-variant)]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={bulkSuspend}
                  className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  Bulk Suspend
                </button>
              </>
            )}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className={`rounded-xl p-3 transition-colors ${searchQuery ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-subtle)] text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"}`}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" onClick={() => setOpenMenuId(null)}>
          <table className="w-full text-left">
            <caption className="sr-only">User Registry</caption>
            <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="w-10 p-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                </th>
                <th className="p-6 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Profile
                </th>
                <th className="p-6 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Role
                </th>
                <th className="p-6 text-center text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Join Date
                </th>
                <th className="p-6 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredProfiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="transition-colors hover:bg-[var(--color-surface-subtle)]/50"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(profile.id)}
                      onChange={() => toggleSelect(profile.id)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-container)] font-black text-[var(--color-primary)] shadow-sm">
                        {profile.avatar_url ? (
                          <BlurImage
                            src={profile.avatar_url}
                            alt={`${profile.full_name || "User"}'s avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          profile.full_name?.[0] || "?"
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">
                          {profile.full_name || "Unknown"}
                        </p>
                        <p className="text-[11px] font-medium text-[var(--color-outline-variant)]">
                          {profile.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                        profile.role === "admin"
                          ? "text-on-primary bg-[var(--color-primary)]"
                          : profile.role === "rider"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                      }`}
                    >
                      {profile.role}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <p className="text-xs font-bold text-[var(--color-outline)]">
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </td>
                  <td className="relative p-6 text-right">
                    <button
                      onClick={(e) => toggleMenu(profile.id, e)}
                      className="rounded p-2 text-[var(--color-outline-variant)] transition-colors hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                      aria-label="More actions"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === profile.id && (
                      <div className="absolute top-10 right-6 z-50 min-w-[140px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-2 shadow-lg">
                        <button
                          onClick={() => handleAction("view", profile)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)]"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                          View Details
                        </button>
                        <button
                          onClick={() => handleAction("edit", profile)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)]"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Change Role
                        </button>
                        <button
                          onClick={() => handleAction("delete", profile)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                          Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 p-6 text-xs font-bold text-[var(--color-outline-variant)]">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
            {totalCount} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 transition-colors hover:bg-[var(--color-surface-subtle)] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-[var(--color-on-surface-variant)]">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 transition-colors hover:bg-[var(--color-surface-subtle)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
          onKeyDown={(e) => e.key === "Escape" && setShowDetailModal(false)}
        >
          <div className="mx-4 w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3
                id="user-detail-title"
                className="text-lg font-black text-[var(--color-on-surface)]"
              >
                User Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-full p-1 hover:bg-[var(--color-surface-container)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">Name</span>
                <span className="font-bold">{selectedProfile.full_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">Email</span>
                <span className="font-bold">{selectedProfile.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">Role</span>
                <span className="font-bold capitalize">{selectedProfile.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">Joined</span>
                <span className="font-bold">
                  {selectedProfile.created_at
                    ? new Date(selectedProfile.created_at).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">ID</span>
                <span className="text-xs font-bold">{selectedProfile.id}</span>
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-on-primary mt-6 w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-change-title"
          onKeyDown={(e) => e.key === "Escape" && setShowRoleModal(false)}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <h3
              id="role-change-title"
              className="mb-4 text-lg font-black text-[var(--color-on-surface)]"
            >
              Change Role — {selectedProfile.full_name}
            </h3>
            <div className="space-y-2">
              {["customer", "admin", "rider"].map((role) => (
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`w-full rounded-xl p-3 text-left font-bold capitalize transition-colors ${newRole === role ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newRole && newRole !== selectedProfile.role) {
                    await supabase
                      .from("profiles")
                      .update({ role: newRole })
                      .eq("id", selectedProfile.id);
                    loadProfiles();
                  }
                  setShowRoleModal(false);
                }}
                disabled={!newRole || newRole === selectedProfile.role}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 font-bold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
