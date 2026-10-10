"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";

interface SponsoredItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: "active" | "paused" | "ended";
  impressions: number;
  clicks: number;
}

export default function SponsoredListingsPage() {
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<SponsoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SponsoredItem | null>(null);
  const [vendors, setVendors] = useState<{ id: string; shop_name: string }[]>([]);
  const [form, setForm] = useState({
    vendor_id: "",
    vendor_name: "",
    start_date: "",
    end_date: "",
    budget: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    loadVendors();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("sponsored_listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as SponsoredItem[]);
    setLoading(false);
  }

  async function loadVendors() {
    const { data } = await supabase.from("vendors").select("id, shop_name").order("shop_name");
    if (data) setVendors(data);
  }

  const handleSave = async () => {
    if (!form.vendor_id || !form.start_date || !form.end_date || !form.budget) {
      useToastStore.getState().addToast("Please fill all required fields", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("sponsored_listings")
          .update({
            vendor_id: form.vendor_id,
            vendor_name: form.vendor_name,
            start_date: form.start_date,
            end_date: form.end_date,
            budget: form.budget,
          })
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sponsored_listings").insert({
          vendor_id: form.vendor_id,
          vendor_name: form.vendor_name,
          start_date: form.start_date,
          end_date: form.end_date,
          budget: form.budget,
          status: "active",
          impressions: 0,
          clicks: 0,
        });
        if (error) throw error;
      }
      setShowCreateModal(false);
      setEditingItem(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      useToastStore.getState().addToast(`Failed: ${msg}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await supabase.from("sponsored_listings").update({ status: newStatus }).eq("id", id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as SponsoredItem["status"] } : item
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      useToastStore.getState().addToast(`Failed: ${msg}`, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete",
        message: "Are you sure you want to delete this sponsored listing?",
        variant: "danger",
      }))
    )
      return;
    try {
      await supabase.from("sponsored_listings").delete().eq("id", id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      useToastStore.getState().addToast(`Failed: ${msg}`, "error");
    }
  };

  const openEditModal = (item: SponsoredItem) => {
    setEditingItem(item);
    setForm({
      vendor_id: item.vendor_id,
      vendor_name: item.vendor_name,
      start_date: item.start_date,
      end_date: item.end_date,
      budget: item.budget,
    });
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({ vendor_id: "", vendor_name: "", start_date: "", end_date: "", budget: 0 });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">
            Sponsored Listings
          </h1>
          <p className="mt-1 text-sm text-[var(--color-outline)]">
            Manage vendor sponsored placements
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="text-on-primary flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Listing
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse py-12 text-center font-medium text-[var(--color-outline-variant)]">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
            campaign
          </span>
          <p className="mt-3 font-medium text-[var(--color-outline-variant)]">
            No sponsored listings yet
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-sm font-bold text-[var(--color-primary)] hover:underline"
          >
            Create your first listing
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]">
          <table className="w-full text-left">
            <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Vendor
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Budget
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Period
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Impressions
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Clicks
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-surface-subtle)]">
                  <td className="p-4 text-sm font-bold text-[var(--color-on-surface)]">
                    {item.vendor_name}
                  </td>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">₹{item.budget}</td>
                  <td className="p-4 text-sm text-[var(--color-outline)]">
                    {new Date(item.start_date).toLocaleDateString()} –{" "}
                    {new Date(item.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm font-bold">{item.impressions.toLocaleString()}</td>
                  <td className="p-4 text-sm font-bold">{item.clicks.toLocaleString()}</td>
                  <td className="p-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-[10px] font-bold uppercase ${
                        item.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : item.status === "paused"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="ended">Ended</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">
                {editingItem ? "Edit Listing" : "New Sponsored Listing"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                className="text-[var(--color-outline-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Vendor *
                </label>
                <select
                  value={form.vendor_id}
                  onChange={(e) => {
                    const v = vendors.find((v) => v.id === e.target.value);
                    setForm({
                      ...form,
                      vendor_id: e.target.value,
                      vendor_name: v?.shop_name || "",
                    });
                  }}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.shop_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Budget (₹) *
                </label>
                <input
                  type="number"
                  value={form.budget || ""}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                  placeholder="5000"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold disabled:opacity-50"
              >
                {saving ? "Saving..." : editingItem ? "Update Listing" : "Create Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
