"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function BannerManagement() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: "", image_url: "", link_url: "" });

  useEffect(() => {
    loadBanners();
  }, [supabase]);

  async function loadBanners() {
    const { data } = await supabase.from("banners").select("*").order("position");
    if (data) setBanners(data);
    setLoading(false);
  }

  async function addBanner() {
    if (!newBanner.title || !newBanner.image_url) return;
    const { data, error } = await supabase.from("banners").insert([{
      title: newBanner.title,
      image_url: newBanner.image_url,
      link_url: newBanner.link_url || null,
      is_active: true,
      position: banners.length + 1
    }]).select().single();
    if (!error && data) {
      setBanners([...banners, data]);
      setShowAdd(false);
      setNewBanner({ title: "", image_url: "", link_url: "" });
    }
  }

  async function toggleBanner(id: string, isActive: boolean) {
    await supabase.from("banners").update({ is_active: !isActive }).eq("id", id);
    loadBanners();
  }

  async function deleteBanner(id: string) {
    await supabase.from("banners").delete().eq("id", id);
    setBanners(banners.filter(b => b.id !== id));
  }

  async function reorderBanners(fromIndex: number, toIndex: number) {
    const newBanners = [...banners];
    const [moved] = newBanners.splice(fromIndex, 1);
    newBanners.splice(toIndex, 0, moved);
    setBanners(newBanners);
    
    for (let i = 0; i < newBanners.length; i++) {
      await supabase.from("banners").update({ position: i + 1 }).eq("id", newBanners[i].id);
    }
  }

  if (loading) return <div className="px-8">Loading banners...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Banner Management</h1>
          <p className="text-slate-500">Manage homepage banners and carousels.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
        >
          + Add Banner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Banners</p>
          <p className="text-3xl font-black text-slate-800">{banners.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
          <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Active</p>
          <p className="text-3xl font-black text-green-600">{banners.filter(b => b.is_active).length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Inactive</p>
          <p className="text-3xl font-black text-slate-400">{banners.filter(b => !b.is_active).length}</p>
        </div>
      </div>

      {/* Banner Reorder */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">Active Banners (Drag to reorder)</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {banners.filter(b => b.is_active).map((banner, index) => (
            <div key={banner.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
              <div className="text-slate-400 cursor-move">
                <span className="material-symbols-outlined">drag_indicator</span>
              </div>
              <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {banner.image_url ? (
                  <img src={banner.image_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-2xl text-slate-300">image</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{banner.title}</p>
                {banner.link_url && (
                  <p className="text-xs text-slate-400">{banner.link_url}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleBanner(banner.id, banner.is_active)}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600"
                >
                  Deactivate
                </button>
                <button 
                  onClick={() => deleteBanner(banner.id)}
                  className="text-slate-400 hover:text-red-500 p-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {banners.filter(b => b.is_active).length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No active banners
            </div>
          )}
        </div>
      </div>

      {/* Inactive Banners */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-400 uppercase tracking-widest text-sm">Inactive Banners</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {banners.filter(b => !b.is_active).map(banner => (
            <div key={banner.id} className="p-4 flex items-center gap-4 opacity-60">
              <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {banner.image_url ? (
                  <img src={banner.image_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-2xl text-slate-300">image</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{banner.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleBanner(banner.id, banner.is_active)}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600"
                >
                  Activate
                </button>
                <button 
                  onClick={() => deleteBanner(banner.id)}
                  className="text-slate-400 hover:text-red-500 p-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {banners.filter(b => !b.is_active).length === 0 && (
            <div className="p-4 text-center text-slate-400 text-sm">
              No inactive banners
            </div>
          )}
        </div>
      </div>

      {/* Add Banner Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Add Banner</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Image URL</label>
                <input
                  type="text"
                  value={newBanner.image_url}
                  onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Link (optional)</label>
                <input
                  type="text"
                  value={newBanner.link_url}
                  onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  placeholder="/app/vendor/123"
                />
              </div>
              <button
                onClick={addBanner}
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018]"
              >
                Add Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}