"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PageAsset {
  id: string;
  section: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  updated_at: string;
}

const SECTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  food_hero: { label: "Food Page Hero", icon: "restaurant", color: "bg-orange-50 border-orange-200" },
  home_hero: { label: "Home Page Hero", icon: "home", color: "bg-blue-50 border-blue-200" },
  grocery_hero: { label: "Grocery Page Hero", icon: "local_grocery_store", color: "bg-green-50 border-green-200" },
  beauty_hero: { label: "Beauty Page Hero", icon: "spa", color: "bg-pink-50 border-pink-200" },
  pharmacy_hero: { label: "Pharmacy Page Hero", icon: "local_pharmacy", color: "bg-purple-50 border-purple-200" },
};

const DEFAULT_SECTIONS = Object.keys(SECTION_LABELS);

export default function PageAssetsPage() {
  const supabase = createClient();
  const [assets, setAssets] = useState<PageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<PageAsset | null>(null);
  const [editForm, setEditForm] = useState({ image_url: "", title: "", subtitle: "", is_active: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ section: "", image_url: "", title: "", subtitle: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadAssets = async () => {
    const { data } = await supabase.from("page_assets").select("*").order("section");
    if (data) setAssets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleEdit = (asset: PageAsset) => {
    setEditingAsset(asset);
    setEditForm({
      image_url: asset.image_url,
      title: asset.title || "",
      subtitle: asset.subtitle || "",
      is_active: asset.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingAsset) return;
    setSaving(true);
    const { error } = await supabase
      .from("page_assets")
      .update({
        image_url: editForm.image_url,
        title: editForm.title || null,
        subtitle: editForm.subtitle || null,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingAsset.id);

    setSaving(false);
    if (!error) {
      setSaveSuccess(editingAsset.section);
      setEditingAsset(null);
      await loadAssets();
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleAdd = async () => {
    if (!newForm.section || !newForm.image_url) return;
    setSaving(true);
    const { error } = await supabase.from("page_assets").upsert({
      section: newForm.section.toLowerCase().replace(/\s+/g, "_"),
      image_url: newForm.image_url,
      title: newForm.title || null,
      subtitle: newForm.subtitle || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "section" });
    setSaving(false);
    if (!error) {
      setShowAddModal(false);
      setNewForm({ section: "", image_url: "", title: "", subtitle: "" });
      await loadAssets();
    }
  };

  const handleToggleActive = async (asset: PageAsset) => {
    await supabase.from("page_assets").update({ is_active: !asset.is_active }).eq("id", asset.id);
    await loadAssets();
  };

  const missingSections = DEFAULT_SECTIONS.filter(
    (s) => !assets.some((a) => a.section === s)
  );

  if (loading) {
    return (
      <div className="px-8 flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Content Manager</h1>
          <p className="text-slate-500">Control hero banners and images shown to customers on each page.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
        >
          + Add Section
        </button>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg font-bold animate-pop-in flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          {SECTION_LABELS[saveSuccess]?.label || saveSuccess} updated!
        </div>
      )}

      {/* Missing sections notice */}
      {missingSections.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-amber-500 text-2xl flex-shrink-0 mt-0.5">warning</span>
          <div>
            <p className="font-bold text-amber-800 mb-1">Some page sections don't have assets yet</p>
            <p className="text-sm text-amber-700">Missing: {missingSections.map(s => SECTION_LABELS[s]?.label || s).join(", ")}</p>
            <p className="text-xs text-amber-600 mt-1">Run the SQL migration first, then they'll appear here automatically.</p>
          </div>
        </div>
      )}

      {/* Assets grid */}
      <div className="space-y-6">
        {assets.map((asset) => {
          const meta = SECTION_LABELS[asset.section];
          return (
            <div
              key={asset.id}
              className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${meta?.color || "border-slate-100"}`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="md:w-72 h-48 md:h-auto flex-shrink-0 relative bg-slate-100">
                  <img
                    src={asset.image_url}
                    alt={asset.title || asset.section}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    {asset.title && <p className="text-white font-black text-lg leading-tight">{asset.title}</p>}
                    {asset.subtitle && <p className="text-white/80 text-xs mt-0.5">{asset.subtitle}</p>}
                  </div>
                  {!asset.is_active && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="bg-red-100 text-red-600 font-bold text-sm px-3 py-1 rounded-full">INACTIVE</span>
                    </div>
                  )}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-600">{meta?.icon || "image"}</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{meta?.label || asset.section}</p>
                        <p className="text-xs text-slate-400 font-mono">{asset.section}</p>
                      </div>
                      <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${asset.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {asset.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image URL</p>
                        <p className="text-sm text-slate-700 font-mono truncate">{asset.image_url}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</p>
                          <p className="text-sm text-slate-700">{asset.title || <span className="text-slate-300 italic">none</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtitle</p>
                          <p className="text-sm text-slate-700">{asset.subtitle || <span className="text-slate-300 italic">none</span>}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        Updated: {new Date(asset.updated_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="flex-1 py-2.5 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(asset)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all ${
                        asset.is_active
                          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {asset.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {assets.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">image_not_supported</span>
            <p className="font-bold text-slate-500">No page assets found.</p>
            <p className="text-sm text-slate-400 mt-1">Run the SQL migration to create the page_assets table first.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Edit {SECTION_LABELS[editingAsset.section]?.label || editingAsset.section}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{editingAsset.section}</p>
              </div>
              <button onClick={() => setEditingAsset(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Live preview */}
              {editForm.image_url && (
                <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={editForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    {editForm.title && <p className="text-white font-black">{editForm.title}</p>}
                    {editForm.subtitle && <p className="text-white/80 text-xs">{editForm.subtitle}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Image URL *</label>
                <input
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                    placeholder="e.g. Gourmet Selection"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subtitle</label>
                  <input
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                    placeholder="e.g. Order from top restaurants"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${editForm.is_active ? "bg-green-500" : "bg-slate-200"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.is_active ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{editForm.is_active ? "Active (shown to users)" : "Inactive (hidden)"}</span>
              </label>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setEditingAsset(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.image_url}
                className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Add Page Section</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Section Key *</label>
                <input
                  value={newForm.section}
                  onChange={(e) => setNewForm({ ...newForm, section: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                  placeholder="e.g. food_hero, home_hero"
                />
                <p className="text-[10px] text-slate-400 mt-1">Use snake_case. Existing keys will be updated.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Image URL *</label>
                <input
                  value={newForm.image_url}
                  onChange={(e) => setNewForm({ ...newForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
                  <input
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subtitle</label>
                  <input
                    value={newForm.subtitle}
                    onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newForm.section || !newForm.image_url}
                className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50 transition-all"
              >
                {saving ? "Saving..." : "Add Section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
