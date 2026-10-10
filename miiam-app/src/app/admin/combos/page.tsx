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
    image_file: null as File | null,
    image_preview: "",
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
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [combos, filterActive, searchQuery]);

  function resetForm() {
    setForm({
      name: "",
      description: "",
      image_url: "",
      image_file: null,
      image_preview: "",
      original_price: "",
      combo_price: "",
      items: "",
      vendor_id: "",
      category: "",
      display_order: "0",
    });
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
      image_file: null,
      image_preview: combo.image_url || "",
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

    let imageUrl = form.image_url || null;
    if (form.image_file) {
      const ext = form.image_file.name.split(".").pop() || "jpg";
      const path = `combos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("store-images")
        .upload(path, form.image_file, { upsert: true });
      if (uploadError) {
        addToast(uploadError.message, "error");
        return;
      }
      const { data: urlData } = supabase.storage.from("store-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: imageUrl,
      original_price: parseFloat(form.original_price),
      combo_price: parseFloat(form.combo_price),
      items: form.items
        ? form.items
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      vendor_id: form.vendor_id || null,
      category: form.category || null,
      display_order: parseInt(form.display_order) || 0,
    };
    if (editingCombo) {
      const { error } = await supabase.from("combos").update(payload).eq("id", editingCombo.id);
      if (error) {
        addToast(error.message, "error");
        return;
      }
      addToast("Combo updated", "success");
    } else {
      const { error } = await supabase.from("combos").insert({ ...payload, is_active: true });
      if (error) {
        addToast(error.message, "error");
        return;
      }
      addToast("Combo created", "success");
    }
    setShowModal(false);
    resetForm();
    const { data } = await supabase
      .from("combos")
      .select("*, vendors(shop_name)")
      .order("display_order", { ascending: true });
    if (data) setCombos(data as Combo[]);
  }

  async function toggleActive(combo: Combo) {
    const { error } = await supabase
      .from("combos")
      .update({ is_active: !combo.is_active })
      .eq("id", combo.id);
    if (error) {
      addToast(error.message, "error");
      return;
    }
    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, is_active: !c.is_active } : c))
    );
  }

  async function deleteCombo(combo: Combo) {
    if (!confirm(`Delete "${combo.name}"?`)) return;
    const { error } = await supabase.from("combos").delete().eq("id", combo.id);
    if (error) {
      addToast(error.message, "error");
      return;
    }
    setCombos((prev) => prev.filter((c) => c.id !== combo.id));
    addToast("Combo deleted", "success");
  }

  const stats = useMemo(
    () => ({
      total: combos.length,
      active: combos.filter((c) => c.is_active).length,
      inactive: combos.filter((c) => !c.is_active).length,
    }),
    [combos]
  );

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Combos</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage combo deals for the home page</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-on-primary hover:bg-primary-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span> Add Combo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-bold text-green-600 uppercase">Active</p>
          <p className="mt-1 text-2xl font-black text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Inactive</p>
          <p className="mt-1 text-2xl font-black text-gray-500">{stats.inactive}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-lg text-gray-400">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search combos..."
            className="focus:ring-accent/40/20 focus:border-accent/40 w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filterActive === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="border-accent/30 border-t-primary mx-auto h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">merge</span>
          <p className="mt-2 text-gray-400">No combos yet. Click "Add Combo" to create one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                  Combo
                </th>
                <th className="px-4 py-3 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                  Vendor
                </th>
                <th className="px-4 py-3 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-[10px] font-black tracking-wider text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-wider text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((combo) => (
                <tr
                  key={combo.id}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {combo.image_url ? (
                          <BlurImage
                            src={combo.image_url}
                            alt={combo.name}
                            fill
                            className="h-full w-full"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            🎉
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{combo.name}</p>
                        <p className="truncate text-[10px] text-gray-400">
                          {combo.items?.join(", ") || "No items"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {combo.vendors?.shop_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 line-through">
                      ₹{combo.original_price}
                    </span>
                    <span className="ml-1.5 text-sm font-black text-gray-900">
                      ₹{combo.combo_price}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(combo)}
                      className={`relative h-5 w-10 rounded-full transition-colors ${combo.is_active ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${combo.is_active ? "left-5.5" : "left-0.5"}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(combo)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                      >
                        <span className="material-symbols-outlined text-sm text-gray-500">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => deleteCombo(combo)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-sm text-red-500">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-black text-gray-900">
              {editingCombo ? "Edit Combo" : "Add Combo"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  placeholder="Burger + Fries + Coke"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  placeholder="Classic combo deal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Image</label>
                <div className="mt-1 flex items-center gap-3">
                  {form.image_preview ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                      <BlurImage
                        src={form.image_preview}
                        alt="Preview"
                        fill
                        className="h-full w-full"
                        sizes="80px"
                      />
                      <button
                        onClick={() =>
                          setForm({ ...form, image_file: null, image_preview: "", image_url: "" })
                        }
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="hover:border-accent/40 hover:bg-accent/10 flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 transition-colors">
                      <span className="material-symbols-outlined text-xl text-gray-400">
                        add_a_photo
                      </span>
                      <span className="mt-0.5 text-[9px] text-gray-400">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setForm({
                              ...form,
                              image_file: file,
                              image_preview: URL.createObjectURL(file),
                            });
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="flex-1">
                    <input
                      value={form.image_url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          image_url: e.target.value,
                          image_preview: e.target.value,
                        })
                      }
                      className="focus:ring-accent/40/20 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Original Price *</label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    placeholder="299"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Combo Price *</label>
                  <input
                    type="number"
                    value={form.combo_price}
                    onChange={(e) => setForm({ ...form, combo_price: e.target.value })}
                    className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    placeholder="199"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Items (comma separated)</label>
                <input
                  value={form.items}
                  onChange={(e) => setForm({ ...form, items: e.target.value })}
                  className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  placeholder="Burger, Fries, Coke"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Vendor</label>
                  <select
                    value={form.vendor_id}
                    onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                    className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  >
                    <option value="">No vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.shop_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    className="focus:ring-accent/40/20 mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-on-primary hover:bg-primary-hover flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors"
              >
                {editingCombo ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
