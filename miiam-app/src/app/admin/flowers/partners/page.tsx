"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface FlowerPartner {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  delivery_charge?: number;
  min_order_amount?: number;
  status: string;
  rating: number;
  total_orders?: number;
  created_at?: string;
}

export default function FlowersPartnersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [partners, setPartners] = useState<FlowerPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<FlowerPartner | null>(null);
  const [saving, setSaving] = useState(false);

  const [newPartner, setNewPartner] = useState({
    shop_name: "",
    owner_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    delivery_charge: "",
    min_order_amount: "",
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("type", "flowers")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const partnersWithOrders = await Promise.all(
        (data || []).map(async (partner: FlowerPartner) => {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("vendor_id", partner.id)
            .eq("vendor_type", "flowers");
          return { ...partner, total_orders: count || 0 };
        })
      );

      setPartners(partnersWithOrders);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth =
        data?.filter((p: FlowerPartner) => new Date(p.created_at ?? "") >= monthStart).length || 0;

      setStats({
        total: data?.length || 0,
        active: data?.filter((p: FlowerPartner) => p.status === "active").length || 0,
        inactive: data?.filter((p: FlowerPartner) => p.status !== "active").length || 0,
        newThisMonth,
      });
    } catch (error) {
      logger.error({ err: error }, "Error loading partners");
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (partnerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ status: newStatus })
        .eq("id", partnerId);

      if (error) throw error;
      loadPartners();
      useToastStore.getState().addToast("Partner status updated!", "success");
    } catch (error) {
      logger.error({ err: error }, "Error updating partner");
      useToastStore.getState().addToast("Failed to update partner status", "error");
    }
  };

  const handleSavePartner = async () => {
    if (!newPartner.shop_name || !newPartner.owner_name || !newPartner.phone) {
      useToastStore
        .getState()
        .addToast("Please fill in all required fields (Shop Name, Owner Name, Phone)", "error");
      return;
    }
    if (
      newPartner.pincode &&
      (newPartner.pincode.length !== 6 || !/^\d{6}$/.test(newPartner.pincode))
    ) {
      useToastStore.getState().addToast("Please enter a valid 6-digit PIN code", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | number | null> = {
        shop_name: newPartner.shop_name,
        owner_name: newPartner.owner_name,
        phone: newPartner.phone,
        email: newPartner.email || null,
        address: newPartner.address || null,
        city: newPartner.city || null,
        state: newPartner.state || null,
        pincode: newPartner.pincode || null,
        landmark: newPartner.landmark || null,
        delivery_charge: newPartner.delivery_charge ? parseFloat(newPartner.delivery_charge) : 0,
        min_order_amount: newPartner.min_order_amount ? parseFloat(newPartner.min_order_amount) : 0,
      };

      if (editingPartner) {
        const { error } = await supabase
          .from("vendors")
          .update(payload)
          .eq("id", editingPartner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendors").insert({
          ...payload,
          type: "flowers",
          status: "active",
          rating: 4.0,
        });
        if (error) throw error;
      }

      resetModal();
      loadPartners();
      useToastStore
        .getState()
        .addToast(
          editingPartner ? "Partner updated successfully!" : "Partner added successfully!",
          "success"
        );
    } catch (error: unknown) {
      logger.error({ err: error }, "Error saving partner");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast("Failed: " + msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (partner: FlowerPartner) => {
    setEditingPartner(partner);
    setNewPartner({
      shop_name: partner.shop_name,
      owner_name: partner.owner_name,
      phone: partner.phone,
      email: partner.email || "",
      address: partner.address || "",
      city: partner.city || "",
      state: partner.state || "",
      pincode: partner.pincode || "",
      landmark: partner.landmark || "",
      delivery_charge: partner.delivery_charge?.toString() || "",
      min_order_amount: partner.min_order_amount?.toString() || "",
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingPartner(null);
    setNewPartner({
      shop_name: "",
      owner_name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      delivery_charge: "",
      min_order_amount: "",
    });
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      searchTerm === "" ||
      partner.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/flowers"
          className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
        >
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Flowers Partners</h1>
          <p className="text-sm text-[var(--color-outline)]">Manage flower shop partners</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-on-primary rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold hover:bg-[#a00018]"
        >
          + Add Partner
        </button>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
          <p className="text-xs font-bold text-[var(--color-outline-variant)]">TOTAL PARTNERS</p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-bold text-green-600">ACTIVE</p>
          <p className="mt-1 text-2xl font-black text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-600">INACTIVE</p>
          <p className="mt-1 text-2xl font-black text-red-700">{stats.inactive}</p>
        </div>
        <div className="bg-accent/10 border-accent/30 rounded-xl border p-4">
          <p className="text-accent text-xs font-bold">NEW THIS MONTH</p>
          <p className="text-accent mt-1 text-2xl font-black">{stats.newThisMonth}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shop name or owner..."
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-3 pr-4 pl-10 focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--color-outline)]">Loading partners...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="rounded-xl bg-[var(--color-surface-container-lowest)] py-12 text-center text-[var(--color-outline)]">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
            store
          </span>
          <p className="mt-4 font-bold">No partners found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Shop Name
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Owner
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Contact
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Orders
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr
                  key={partner.id}
                  className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
                >
                  <td className="p-4">
                    <div className="font-bold text-[var(--color-on-surface)]">
                      {partner.shop_name}
                    </div>
                    <div className="text-xs text-[var(--color-outline)]">Flowers</div>
                  </td>
                  <td className="p-4 text-[var(--color-on-surface-variant)]">
                    {partner.owner_name}
                  </td>
                  <td className="p-4">
                    <div className="text-[var(--color-on-surface)]">{partner.phone}</div>
                    <div className="text-xs text-[var(--color-outline)]">{partner.email || ""}</div>
                  </td>
                  <td className="p-4 font-bold text-[var(--color-on-surface)]">
                    {partner.total_orders || 0}
                  </td>
                  <td className="p-4">
                    <select
                      value={partner.status}
                      onChange={(e) => updatePartnerStatus(partner.id, e.target.value)}
                      className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-bold ${partner.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openEditModal(partner)}
                      className="mr-4 text-sm font-bold text-[var(--color-primary)] hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 py-8">
          <div className="mx-4 my-auto w-full max-w-lg rounded-2xl bg-[var(--color-surface-container-lowest)]">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                  {editingPartner ? "Edit Partner" : "Add Flower Partner"}
                </h2>
                <button
                  onClick={resetModal}
                  className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
              <p className="mt-1 text-sm text-[var(--color-outline)]">
                All fields marked * are required
              </p>
            </div>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              {/* Owner / Contact */}
              <div>
                <h3 className="mb-3 text-xs font-black tracking-widest text-[var(--color-outline)] uppercase">
                  Owner Details
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={newPartner.owner_name}
                      onChange={(e) => setNewPartner({ ...newPartner, owner_name: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={newPartner.phone}
                        onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="99578 73472"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newPartner.email}
                        onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="owner@email.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div>
                <h3 className="mb-3 text-xs font-black tracking-widest text-[var(--color-outline)] uppercase">
                  Shop Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                      Shop / Store Name *
                    </label>
                    <input
                      type="text"
                      value={newPartner.shop_name}
                      onChange={(e) => setNewPartner({ ...newPartner, shop_name: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Floral Studio, Bloom & Blossom"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                      Full Address *
                    </label>
                    <textarea
                      value={newPartner.address}
                      onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="House/Shop No., Building, Street, Area"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        City *
                      </label>
                      <input
                        type="text"
                        value={newPartner.city}
                        onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="e.g. Delhi, Mumbai"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        State
                      </label>
                      <input
                        type="text"
                        value={newPartner.state}
                        onChange={(e) => setNewPartner({ ...newPartner, state: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="e.g. Assam, Delhi"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        PIN Code *
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        value={newPartner.pincode}
                        onChange={(e) =>
                          setNewPartner({
                            ...newPartner,
                            pincode: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="e.g. 783331"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                        Landmark
                      </label>
                      <input
                        type="text"
                        value={newPartner.landmark}
                        onChange={(e) => setNewPartner({ ...newPartner, landmark: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Near Metro Station"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Settings */}
              <div>
                <h3 className="mb-3 text-xs font-black tracking-widest text-[var(--color-outline)] uppercase">
                  Delivery Settings
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                      Delivery Charge (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={newPartner.delivery_charge}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, delivery_charge: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                      Min Order Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={newPartner.min_order_amount}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, min_order_amount: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 border-t p-6">
              <button
                onClick={resetModal}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePartner}
                disabled={saving}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold hover:bg-[#a00018] disabled:opacity-50"
              >
                {saving ? "Saving..." : editingPartner ? "Update Partner" : "Add Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
