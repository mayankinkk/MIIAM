"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface GroceryPartner {
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
  cuisine: string;
  total_orders: number;
  created_at: string;
}

export default function GroceryPartnersPage() {
  const [partners, setPartners] = useState<GroceryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<GroceryPartner | null>(null);
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
        .eq("type", "grocery")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const partnersWithOrders = await Promise.all(
        (data || []).map(async (partner: any) => {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("vendor_id", partner.id)
            .eq("vendor_type", "grocery");
          return { ...partner, total_orders: count || 0 };
        })
      );
      
      setPartners(partnersWithOrders);
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = data?.filter((p: any) => new Date(p.created_at) >= monthStart).length || 0;
      
      setStats({
        total: data?.length || 0,
        active: data?.filter((p: any) => p.status === "active").length || 0,
        inactive: data?.filter((p: any) => p.status !== "active").length || 0,
        newThisMonth,
      });
    } catch (error) {
      console.error("Error loading partners:", error);
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
      alert("Partner status updated!");
    } catch (error) {
      console.error("Error updating partner:", error);
      alert("Failed to update partner status");
    }
  };

  const handleSavePartner = async () => {
    if (!newPartner.shop_name || !newPartner.owner_name || !newPartner.phone) {
      alert("Please fill in all required fields (Shop Name, Owner Name, Phone)");
      return;
    }
    if (newPartner.pincode && (newPartner.pincode.length !== 6 || !/^\d{6}$/.test(newPartner.pincode))) {
      alert("Please enter a valid 6-digit PIN code");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
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
          type: "grocery",
          status: "active",
          rating: 4.0,
          cuisine: "Grocery",
        });
        if (error) throw error;
      }
      
      resetModal();
      loadPartners();
      alert(editingPartner ? "Partner updated successfully!" : "Partner added successfully!");
    } catch (error: any) {
      console.error("Error saving partner:", error);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (partner: GroceryPartner) => {
    setEditingPartner(partner);
    setNewPartner({
      shop_name: partner.shop_name,
      owner_name: partner.owner_name,
      phone: partner.phone,
      email: partner.email || "",
      address: partner.address || "",
      city: (partner as any).city || "",
      state: (partner as any).state || "",
      pincode: (partner as any).pincode || "",
      landmark: (partner as any).landmark || "",
      delivery_charge: (partner as any).delivery_charge?.toString() || "",
      min_order_amount: (partner as any).min_order_amount?.toString() || "",
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingPartner(null);
    setNewPartner({ shop_name: "", owner_name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", landmark: "", delivery_charge: "", min_order_amount: "" });
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === "" || 
      partner.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/grocery" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Grocery Partners</h1>
          <p className="text-slate-500 text-sm">Manage grocery store partners and vendors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
        >
          + Add Partner
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL PARTNERS</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs font-bold">ACTIVE</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">INACTIVE</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-xs font-bold">NEW THIS MONTH</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.newThisMonth}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shop name or owner..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading partners...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">store</span>
          <p className="mt-4 font-bold">No partners found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Shop Name</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Owner</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Contact</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Orders</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{partner.shop_name}</div>
                    <div className="text-xs text-slate-500">{partner.cuisine || "Grocery"}</div>
                  </td>
                  <td className="p-4 text-slate-600">{partner.owner_name}</td>
                  <td className="p-4">
                    <div className="text-slate-800">{partner.phone}</div>
                    <div className="text-xs text-slate-500">{partner.email || ""}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{partner.total_orders || 0}</td>
                  <td className="p-4">
                    <select
                      value={partner.status}
                      onChange={(e) => updatePartnerStatus(partner.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${
                        partner.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => openEditModal(partner)}
                      className="text-[#ba001c] font-bold text-sm hover:underline mr-4"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 my-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editingPartner ? "Edit Partner" : "Add Grocery Partner"}</h2>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">Fields marked * are required</p>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Owner Details */}
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Owner Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Owner Name *</label>
                    <input type="text" value={newPartner.owner_name} onChange={(e) => setNewPartner({ ...newPartner, owner_name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Enter owner name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Phone *</label>
                      <input type="tel" value={newPartner.phone} onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
                      <input type="email" value={newPartner.email} onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="owner@email.com" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Shop Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Shop Name *</label>
                    <input type="text" value={newPartner.shop_name} onChange={(e) => setNewPartner({ ...newPartner, shop_name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="e.g. Fresh Mart, Daily Grocery" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Full Address</label>
                    <textarea value={newPartner.address} onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Shop No., Street, Area" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">City *</label>
                      <input type="text" value={newPartner.city} onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="e.g. Gauripur, Delhi" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">State</label>
                      <input type="text" value={newPartner.state} onChange={(e) => setNewPartner({ ...newPartner, state: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="e.g. Assam" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">PIN Code *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        value={newPartner.pincode}
                        onChange={(e) => setNewPartner({ ...newPartner, pincode: e.target.value.replace(/\D/g, "") })}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                        placeholder="e.g. 783331"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">Landmark</label>
                      <input type="text" value={newPartner.landmark} onChange={(e) => setNewPartner({ ...newPartner, landmark: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Near Market, Signal" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Delivery Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Delivery Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input type="number" min="0" value={newPartner.delivery_charge} onChange={(e) => setNewPartner({ ...newPartner, delivery_charge: e.target.value })} className="w-full p-3 pl-7 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Min Order Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input type="number" min="0" value={newPartner.min_order_amount} onChange={(e) => setNewPartner({ ...newPartner, min_order_amount: e.target.value })} className="w-full p-3 pl-7 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-4">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePartner} disabled={saving} className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50">
                {saving ? "Saving..." : editingPartner ? "Update Partner" : "Add Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}