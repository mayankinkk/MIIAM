"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ProfileSkeleton } from "@/components/Skeleton";
import { useConfirm } from "@/components/ui/ConfirmDialog";
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

  useEffect(() => {
    loadProfiles();
  }, [page, searchQuery]);

  const filteredProfiles = searchQuery
    ? profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : profiles;

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
      if (await confirm({ title: "Delete", message: `Are you sure you want to delete ${profile.full_name}?`, variant: "danger" })) {
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
        supabase.from("profiles").select("*", { count: "exact" }).range(from, to).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true })
      ]);
      if (data) setProfiles(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="h-10 w-48 bg-[var(--color-surface-container-high)] rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-[var(--color-surface-container-high)] rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6">
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-[var(--color-surface-container-high)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[var(--color-surface-container-high)] rounded animate-pulse" />
                <div className="h-3 w-48 bg-[var(--color-surface-container-high)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">User Registry</h1>
          <p className="text-[var(--color-outline)]">Manage all customer and staff accounts across MIIAM.</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
           <div className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 flex items-center gap-2 flex-1 max-w-sm">
             <span className="material-symbols-outlined text-[var(--color-outline-variant)] text-sm">search</span>
             <input
               type="text"
               value={searchQuery}
               onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
               placeholder="Search by name, email or ID..."
               aria-label="Search users"
               className="bg-transparent border-none focus:outline-none text-sm w-full"
             />
           </div>
            <button
              onClick={() => { setSearchQuery(""); setPage(1); }}
              className={`p-3 rounded-xl transition-colors ${searchQuery ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-subtle)] text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"}`}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
        </div>
        
        <div className="overflow-x-auto" onClick={() => setOpenMenuId(null)}>
          <table className="w-full text-left">
            <caption className="sr-only">User Registry</caption>
            <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
              <tr>
                <th className="p-6 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Profile</th>
                <th className="p-6 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Role</th>
                <th className="p-6 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-center">Join Date</th>
                <th className="p-6 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)] font-black overflow-hidden shadow-sm">
                        {profile.avatar_url ? <BlurImage src={profile.avatar_url} alt={`${profile.full_name || 'User'}'s avatar`} className="w-full h-full object-cover" /> : profile.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">{profile.full_name || "Unknown"}</p>
                        <p className="text-[11px] text-[var(--color-outline-variant)] font-medium">{profile.email || "No email"}</p>
                    </div>
                  </div>
                </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      profile.role === 'admin' ? 'bg-[var(--color-primary)] text-white' :
                      profile.role === 'rider' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                      'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <p className="text-xs text-[var(--color-outline)] font-bold">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</p>
                  </td>
                  <td className="p-6 text-right relative">
                    <button 
                      onClick={(e) => toggleMenu(profile.id, e)}
                      className="text-[var(--color-outline-variant)] hover:text-[var(--color-primary)] transition-colors p-2 rounded hover:bg-[var(--color-surface-container)]"
                      aria-label="More actions"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === profile.id && (
                      <div className="absolute right-6 top-10 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl shadow-lg py-2 z-50 min-w-[140px]">
                        <button 
                          onClick={() => handleAction("view", profile)}
                          className="w-full px-4 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)] flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                          View Details
                        </button>
                        <button 
                          onClick={() => handleAction("edit", profile)}
                          className="w-full px-4 py-2 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)] flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Change Role
                        </button>
                        <button 
                          onClick={() => handleAction("delete", profile)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
        
        <div className="p-6 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-[var(--color-outline-variant)]">
          <p>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} users</p>
          <div className="flex gap-2">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1}
               className="px-4 py-2 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors disabled:opacity-50"
             >
               Previous
             </button>
             <span className="px-4 py-2 text-[var(--color-on-surface-variant)]">Page {page} of {totalPages || 1}</span>
             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page >= totalPages}
               className="px-4 py-2 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] transition-colors disabled:opacity-50"
             >
               Next
             </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="user-detail-title" onKeyDown={(e) => e.key === "Escape" && setShowDetailModal(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 id="user-detail-title" className="text-lg font-black text-[var(--color-on-surface)]">User Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-[var(--color-surface-container)] rounded-full" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-[var(--color-outline)]">Name</span><span className="font-bold">{selectedProfile.full_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-outline)]">Email</span><span className="font-bold">{selectedProfile.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-outline)]">Role</span><span className="font-bold capitalize">{selectedProfile.role}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-outline)]">Joined</span><span className="font-bold">{selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString("en-IN") : "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-outline)]">ID</span><span className="font-bold text-xs">{selectedProfile.id}</span></div>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="w-full mt-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl">Close</button>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="role-change-title" onKeyDown={(e) => e.key === "Escape" && setShowRoleModal(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 id="role-change-title" className="text-lg font-black text-[var(--color-on-surface)] mb-4">Change Role — {selectedProfile.full_name}</h3>
            <div className="space-y-2">
              {["customer", "admin", "rider"].map(role => (
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`w-full p-3 rounded-xl text-left font-bold capitalize transition-colors ${newRole === role ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 py-3 border border-[var(--color-border-subtle)] font-bold rounded-xl">Cancel</button>
              <button
                onClick={async () => {
                  if (newRole && newRole !== selectedProfile.role) {
                    await supabase.from("profiles").update({ role: newRole }).eq("id", selectedProfile.id);
                    loadProfiles();
                  }
                  setShowRoleModal(false);
                }}
                disabled={!newRole || newRole === selectedProfile.role}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl disabled:opacity-50"
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
