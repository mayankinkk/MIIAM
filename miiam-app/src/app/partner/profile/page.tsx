"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";

interface VendorProfile {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  cuisine: string;
  description: string;
  cover_image_url: string;
  opening_hours: string;
  min_order_amount: number;
  delivery_charge: number;
  delivery_time_min: number;
  delivery_time_max: number;
  is_pure_veg: boolean;
  gst_number: string;
  fssai_number: string;
  pan_number: string;
  type: string;
}

export default function VendorProfilePage() {
  const supabase = createClient();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"store" | "business" | "delivery">("store");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Partial<VendorProfile>>({});

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `vendor/${vendor?.id || "new"}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(fileName, file);
    if (uploadError) {
      alert("Upload failed. Make sure the 'menu-images' bucket exists in Supabase Storage with public read access.");
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);
    return publicUrl;
  }

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const data = await getVendorForUser();
    if (data) {
      setVendor(data as any);
      setForm(data as any);
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!vendor) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("vendors").update(form).eq("id", vendor.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading settings...</div>;
  }

  if (!vendor) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">No Store Found</h2>
        <p className="text-slate-500">Register your store to access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Store Settings</h1>
          <p className="text-slate-500 mt-1">Manage your store profile and business details</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            saved
              ? "bg-green-100 text-green-700"
              : "bg-[#ba001c] text-white hover:bg-[#a40017]"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200">
        {([
          { id: "store", label: "Store Info", icon: "store" },
          { id: "business", label: "Business Docs", icon: "description" },
          { id: "delivery", label: "Delivery Settings", icon: "local_shipping" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id ? "bg-[#ffe1e4] text-[#ba001c]" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Store Info */}
      {activeTab === "store" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 group">
              {form.cover_image_url ? (
                <img src={form.cover_image_url} alt="Store" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-slate-300">store</span>
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                <span className="material-symbols-outlined text-white text-2xl">camera_alt</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploading(true);
                      const url = await uploadImage(file);
                      if (url) setForm({ ...form, cover_image_url: url });
                      setUploading(false);
                    }
                  }}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                  <span className="material-symbols-outlined text-[#ba001c] animate-spin">progress_activity</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{form.shop_name || "Your Store"}</h3>
              <p className="text-sm text-slate-500">{form.cuisine || "No cuisine set"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Shop Name</label>
              <input
                type="text"
                value={form.shop_name || ""}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Store Type</label>
              <select
                value={form.type || "food"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              >
                <option value="food">Food & Restaurant</option>
                <option value="grocery">Grocery</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="flowers">Flowers & Gifts</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Owner Name</label>
              <input
                type="text"
                value={form.owner_name || ""}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Cuisine / Category</label>
              <input
                type="text"
                value={form.cuisine || ""}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                placeholder="e.g., Indian, Chinese, Italian"
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Tell customers about your store..."
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Address</label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">State</label>
              <input
                type="text"
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Pincode</label>
              <input
                type="text"
                value={form.pincode || ""}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Opening Hours</label>
              <input
                type="text"
                value={form.opening_hours || ""}
                onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                placeholder="e.g., 9:00 AM - 10:00 PM"
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={form.is_pure_veg || false}
                  onChange={(e) => setForm({ ...form, is_pure_veg: e.target.checked })}
                  className="w-5 h-5 accent-[#ba001c]"
                />
                <span className="text-sm font-semibold text-slate-700">Pure Vegetarian Store</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Business Docs */}
      {activeTab === "business" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <p className="text-sm text-slate-500">Your business documents are stored securely for verification purposes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">GST Number</label>
              <input
                type="text"
                value={form.gst_number || ""}
                onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                placeholder="e.g., 22AAAAA0000A1Z5"
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">FSSAI Number</label>
              <input
                type="text"
                value={form.fssai_number || ""}
                onChange={(e) => setForm({ ...form, fssai_number: e.target.value })}
                placeholder="e.g., 12345678901234"
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">PAN Number</label>
              <input
                type="text"
                value={form.pan_number || ""}
                onChange={(e) => setForm({ ...form, pan_number: e.target.value })}
                placeholder="e.g., ABCDE1234F"
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Settings */}
      {activeTab === "delivery" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Min Order Amount (₹)</label>
              <input
                type="number"
                value={form.min_order_amount || 0}
                onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Delivery Charge (₹)</label>
              <input
                type="number"
                value={form.delivery_charge || 0}
                onChange={(e) => setForm({ ...form, delivery_charge: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Min Delivery Time (min)</label>
              <input
                type="number"
                value={form.delivery_time_min || 0}
                onChange={(e) => setForm({ ...form, delivery_time_min: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Max Delivery Time (min)</label>
              <input
                type="number"
                value={form.delivery_time_max || 0}
                onChange={(e) => setForm({ ...form, delivery_time_max: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
