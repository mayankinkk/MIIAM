"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ProfileSkeleton } from "@/components/Skeleton";

const PAGE_SIZE = 15;

export default function UserRegistry() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [page]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = async (action: string, profile: Profile) => {
    setOpenMenuId(null);
    if (action === "view") {
      alert(`View user: ${profile.full_name}\nEmail: ${profile.email}\nRole: ${profile.role}`);
    } else if (action === "edit") {
      const newRole = prompt("Enter new role (customer/admin/rider):", profile.role);
      if (newRole && ["customer", "admin", "rider"].includes(newRole)) {
        await supabase.from("profiles").update({ role: newRole }).eq("id", profile.id);
        loadProfiles();
      }
    } else if (action === "delete") {
      if (confirm(`Are you sure you want to delete ${profile.full_name}?`)) {
        await supabase.from("profiles").delete().eq("id", profile.id);
        loadProfiles();
      }
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const [{ data, count }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact" }).range(from, to).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true })
    ]);
    
    if (data) setProfiles(data);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-slate-200 rounded animate-pulse" />
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">User Registry</h1>
          <p className="text-slate-500">Manage all customer and staff accounts across MIIAM.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
           <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center gap-2 flex-1 max-w-sm">
             <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
             <input type="text" placeholder="Search by name, email or ID..." className="bg-transparent border-none focus:outline-none text-sm w-full" />
           </div>
           <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors">
             <span className="material-symbols-outlined">filter_list</span>
           </button>
        </div>
        
        <div className="overflow-x-auto" onClick={() => setOpenMenuId(null)}>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Loyalty Pts</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Join Date</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#ffe1e4] flex items-center justify-center text-[#ba001c] font-black overflow-hidden shadow-sm">
                        {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{profile.full_name || "Unknown"}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{profile.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      profile.role === 'admin' ? 'bg-[#ba001c] text-white' :
                      profile.role === 'rider' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-800">{profile.loyalty_points ?? 0}</span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, ((profile.loyalty_points ?? 0)/500)*100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <p className="text-xs text-slate-500 font-bold">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</p>
                  </td>
                  <td className="p-6 text-right relative">
                    <button 
                      onClick={(e) => toggleMenu(profile.id, e)}
                      className="text-slate-400 hover:text-[#ba001c] transition-colors p-2 rounded hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === profile.id && (
                      <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 min-w-[140px]">
                        <button 
                          onClick={() => handleAction("view", profile)}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                          View Details
                        </button>
                        <button 
                          onClick={() => handleAction("edit", profile)}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
        
        <div className="p-6 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
          <p>Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} users</p>
          <div className="flex gap-2">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1}
               className="px-4 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors disabled:opacity-50"
             >
               Previous
             </button>
             <span className="px-4 py-2 text-slate-600">Page {page} of {totalPages || 1}</span>
             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page >= totalPages}
               className="px-4 py-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors disabled:opacity-50"
             >
               Next
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
