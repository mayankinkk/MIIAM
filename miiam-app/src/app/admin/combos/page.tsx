"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

interface Combo {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  original_price: number;
  combo_price: number;
  items: string[];
  category: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  vendors?: { shop_name: string } | null;
}

interface Vendor {
  id: string;
  shop_name: string;
}

export default function CombosPage() {
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    original_price: "",
    combo_price: "",
    items: "",
    vendor_id: "",
    category: "",
    display_order: "0",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [combosResult, vendorsResult] = await Promise.all([
        supabase
          .from("combos")
          .select("*, vendors(shop_name)")
          .order("display_order", { ascending: true }),
        supabase.from("vendors").select("id, shop_name").order("shop_name"),
      ]);
      if (combosResult.data) setCombos(combosResult.data as Combo[]);
      if (vendorsResult.data) setVendors(vendorsResult.data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    let result = combos;
    if (filterActive === "active") result = result.filter((c) => c.is_active);
    if (filterActive === "inactive") result = result.filter((c) => !c.is_active);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    return result;
  }, [combos, filterActive, searchQuery]);

  function resetForm() {
    setForm({ name: "", description: "", image_url: "", original_price: "", combo_price: "", items: "", vendor_id: "", category: "", display_order: "0" });
    setEditingCombo(null);
  }

  function openAdd() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(combo: Combo) {
    setForm({
      name: combo.name,
      description: combo.description || "",
      image_url: combo.image_url || "",
      original_price: String(combo.original_price),
      combo_price: String(combo.combo_price),
      items: combo.items.join(", "),
      vendor_id: combo.vendor_id || "",
      category: combo.category || "",
      display_order: String(combo.display_order),
    });
    setEditingCombo(combo);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.original_price || !form.combo_price) {
      addToast("Name and prices are required", "error");
      return;
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: form.image_url || null,
      original_price: parseFloat(form.original_price),
      combo_price: parseFloat(form.combo_price),
      items: form.items ? form.items.split(",").map((s) => s.trim()).filter(Boolean) : [],
      vendor_id: form.vendor_id || null,
      category: form.category || null,
      display_order: parseInt(form.display_order) || 0,
    };
    if (editingCombo) {
      const { error } = await supabase.from("combos").update(payload).eq("id", editingCombo.id);
      if (error) { addToast(error.message, "error"); return; }
      addToast("Combo updated", "success");
    } else {
      const { error } = await supabase.from("combos").insert({ ...payload, is_active: true });
      if (error) { addToast(error.message, "error"); return; }
      addToast("Combo created", "success");
    }
    setShowModal(false);
    resetForm();
    const { data } = await supabase.from("combos").select("*, vendors(shop_name)").order("display_order", { ascending: true });
    if (data) setCombos(data as Combo[]);
  }

  async function toggleActive(combo: Combo) {
    const { error } = await supabase.from("combos").update({ is_active: !combo.is_active }).eq("id", combo.id);
    if (error) { addToast(error.message, "error"); return; }
    setCombos((prev) => prev.map((c) => (c.id === combo.id ? { ...c, is_active: !c.is_active } : c)));
  }

  async function deleteCombo(combo: Combo) {
    if (!confirm(`Delete "${combo.name}"?`)) return;
    const { error } = await supabase.from("combos").delete().eq("id", combo.id);
    if (error) { addToast(error.message, "error"); return; }
    setCombos((prev) => prev.filter((c) => c.id !== combo.id));
    addToast("Combo deleted", "success");
  }

  const stats = useMemo(() => ({
    total: combos.length,
    active: combos.filter((c) => c.is_active).length,
    inactive: combos.filter((c) => !c.is_active).length,
  }), [combos]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Combos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage combo deals for the home page</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
          <span className="material-symbols-outlined text-lg">add</span> Add Combo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs font-bold text-green-600 uppercase">Active</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Inactive</p>
          <p className="text-2xl font-black text-gray-500 mt-1">{stats.inactive}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search combos..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilterActive(f)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${filterActive === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-5xl text-gray-300">merge</span>
          <p className="text-gray-400 mt-2">No combos yet. Click "Add Combo" to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Combo</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((combo) => (
                <tr key={combo.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {combo.image_url ? <BlurImage src={combo.image_url} alt={combo.name} fill className="w-full h-full" sizes="48px" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎉</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{combo.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{combo.items?.join(", ") || "No items"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{combo.vendors?.shop_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 line-through">₹{combo.original_price}</span>
                    <span className="text-sm font-black text-gray-900 ml-1.5">₹{combo.combo_price}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(combo)} className={`w-10 h-5 rounded-full relative transition-colors ${combo.is_active ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${combo.is_active ? "left-5.5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(combo)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined text-sm text-gray-500">edit</span></button>
                      <button onClick={() => deleteCombo(combo)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><span className="material-symbols-outlined text-sm text-red-500">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900 mb-4">{editingCombo ? "Edit Combo" : "Add Combo"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Burger + Fries + Coke" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Classic combo deal" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Original Price *</label>
                  <input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="299" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Combo Price *</label>
                  <input type="number" value={form.combo_price} onChange={(e) => setForm({ ...form, combo_price: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="199" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Items (comma separated)</label>
                <input value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Burger, Fries, Coke" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Vendor</label>
                  <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">No vendor</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.shop_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Display Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">{editingCombo ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
