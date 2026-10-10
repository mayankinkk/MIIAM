"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { getVendorForUser } from "@/lib/vendor";
import BlurImage from "@/components/BlurImage";

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
  banner_url: string;
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
  cancellation_policy: string;
  delivery_zones: string[];
}

export default function VendorProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"store" | "business" | "delivery">("store");
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState<"cover" | "banner" | null>(null);

  const [form, setForm] = useState<Partial<VendorProfile>>({});

  async function uploadImage(file: File): Promise<string | null> {
    const { compressImage } = await import("@/lib/image-compress");
    const compressed = await compressImage(file);
    const fileName = `vendor/${vendor?.id || "new"}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(fileName, compressed);
    if (uploadError) {
      useToastStore
        .getState()
        .addToast(
          "Upload failed. Make sure the 'menu-images' bucket exists in Supabase Storage with public read access.",
          "error"
        );
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    return publicUrl;
  }

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const data = await getVendorForUser();
    if (data) {
      const vendorData = data as Partial<VendorProfile>;
      setVendor(vendorData as VendorProfile);
      setForm(vendorData);
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!vendor) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.from("vendors").update(form).eq("id", vendor.id);
    if (error) {
      useToastStore.getState().addToast(`Failed to save: ${error.message}`, "error");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse p-8 text-center font-medium text-[var(--color-outline-variant)]">
        Loading settings...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
          storefront
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          No Store Found
        </h2>
        <p className="text-[var(--color-outline)]">Register your store to access settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Store Settings
          </h1>
          <p className="mt-1 text-[var(--color-outline)]">
            Manage your store profile and business details
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded-xl px-6 py-3 text-sm font-bold transition-all ${
            saved
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "text-on-primary bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim)]"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-1.5 shadow-sm"
        role="tablist"
      >
        {(
          [
            { id: "store", label: "Store Info", icon: "store" },
            { id: "business", label: "Business Docs", icon: "description" },
            { id: "delivery", label: "Delivery Settings", icon: "local_shipping" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-[var(--color-surface-container)] text-[var(--color-primary)]"
                : "text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Store Info */}
      {activeTab === "store" && (
        <div
          role="tabpanel"
          className="space-y-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
        >
          <div className="flex items-center gap-6">
            <div className="group relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface-container)]">
              {form.cover_image_url ? (
                <BlurImage
                  src={form.cover_image_url}
                  alt="Store"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">
                  store
                </span>
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="material-symbols-outlined text-2xl text-white">camera_alt</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.startsWith("image/")) {
                        useToastStore.getState().addToast("Only image files are allowed", "error");
                        return;
                      }
                      setUploading(true);
                      const url = await uploadImage(file);
                      if (url) setForm({ ...form, cover_image_url: url });
                      setUploading(false);
                    }
                  }}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)]/60">
                  <span className="material-symbols-outlined animate-spin text-[var(--color-primary)]">
                    progress_activity
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setShowUrlInput(showUrlInput === "cover" ? null : "cover")}
                className="text-left text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                {showUrlInput === "cover" ? "Hide URL input" : "Or enter image URL"}
              </button>
              {showUrlInput === "cover" && (
                <input
                  type="url"
                  value={form.cover_image_url || ""}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-on-surface)]">
                {form.shop_name || "Your Store"}
              </h3>
              <p className="text-sm text-[var(--color-outline)]">
                {form.cuisine || "No cuisine set"}
              </p>
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label
              htmlFor="banner_image"
              className="mb-2 block text-sm font-semibold text-[var(--color-on-surface)]"
            >
              Banner Image
            </label>
            <div className="group relative h-40 w-full overflow-hidden rounded-2xl bg-[var(--color-surface-container)]">
              {form.banner_url ? (
                <BlurImage
                  src={form.banner_url}
                  alt="Store Banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-[var(--color-outline-variant)]/60">
                  <span className="material-symbols-outlined text-5xl">panorama</span>
                  <span className="mt-1 text-sm">Click to upload banner</span>
                </div>
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="material-symbols-outlined text-3xl text-white">camera_alt</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.startsWith("image/")) {
                        useToastStore.getState().addToast("Only image files are allowed", "error");
                        return;
                      }
                      setUploading(true);
                      const url = await uploadImage(file);
                      if (url) setForm({ ...form, banner_url: url });
                      setUploading(false);
                    }
                  }}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)]/60">
                  <span className="material-symbols-outlined animate-spin text-[var(--color-primary)]">
                    progress_activity
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowUrlInput(showUrlInput === "banner" ? null : "banner")}
              className="mt-2 text-xs font-bold text-[var(--color-primary)] hover:underline"
            >
              {showUrlInput === "banner" ? "Hide URL input" : "Or enter image URL"}
            </button>
            {showUrlInput === "banner" && (
              <input
                type="url"
                value={form.banner_url || ""}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="mt-2 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            )}
            <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
              Recommended: 1200×400px. Shows at the top of your store page.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="shop_name"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Shop Name
              </label>
              <input
                id="shop_name"
                type="text"
                value={form.shop_name || ""}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="store_type"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Store Type
              </label>
              <select
                id="store_type"
                value={form.type || "food"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="food">Food & Restaurant</option>
                <option value="grocery">Grocery</option>
                <option value="flowers">Flowers & Gifts</option>
                <option value="printing">Printing & Documents</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="owner_name"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Owner Name
              </label>
              <input
                id="owner_name"
                type="text"
                value={form.owner_name || ""}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="cuisine"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Cuisine / Category
              </label>
              <input
                id="cuisine"
                type="text"
                value={form.cuisine || ""}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                placeholder="e.g., Indian, Chinese, Italian"
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Description
              </label>
              <textarea
                id="description"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Tell customers about your store..."
                className="mt-1 w-full resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                State
              </label>
              <input
                id="state"
                type="text"
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="pincode"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Pincode
              </label>
              <input
                id="pincode"
                type="text"
                value={form.pincode || ""}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="opening_hours"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Opening Hours
              </label>
              <input
                id="opening_hours"
                type="text"
                value={form.opening_hours || ""}
                onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                placeholder="e.g., 9:00 AM - 10:00 PM"
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="is_pure_veg" className="mt-6 flex cursor-pointer items-center gap-3">
                <input
                  id="is_pure_veg"
                  type="checkbox"
                  checked={form.is_pure_veg || false}
                  onChange={(e) => setForm({ ...form, is_pure_veg: e.target.checked })}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Pure Vegetarian Store
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Business Docs */}
      {activeTab === "business" && (
        <div
          role="tabpanel"
          className="space-y-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
        >
          <p className="text-sm text-[var(--color-outline)]">
            Your business documents are stored securely for verification purposes.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="phone"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="gst_number"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                GST Number
              </label>
              <input
                id="gst_number"
                type="text"
                value={form.gst_number || ""}
                onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                placeholder="e.g., 22AAAAA0000A1Z5"
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="fssai_number"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                FSSAI Number
              </label>
              <input
                id="fssai_number"
                type="text"
                value={form.fssai_number || ""}
                onChange={(e) => setForm({ ...form, fssai_number: e.target.value })}
                placeholder="e.g., 12345678901234"
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="pan_number"
                className="text-sm font-semibold text-[var(--color-on-surface)]"
              >
                PAN Number
              </label>
              <input
                id="pan_number"
                type="text"
                value={form.pan_number || ""}
                onChange={(e) => setForm({ ...form, pan_number: e.target.value })}
                placeholder="e.g., ABCDE1234F"
                className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Settings */}
      {activeTab === "delivery" && (
        <div role="tabpanel" className="space-y-6">
          <div className="space-y-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="min_order_amount"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Min Order Amount (₹)
                </label>
                <input
                  id="min_order_amount"
                  type="number"
                  value={form.min_order_amount || 0}
                  onChange={(e) =>
                    setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="delivery_charge"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Delivery Charge (₹)
                </label>
                <input
                  id="delivery_charge"
                  type="number"
                  value={form.delivery_charge || 0}
                  onChange={(e) =>
                    setForm({ ...form, delivery_charge: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="delivery_time_min"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Min Delivery Time (min)
                </label>
                <input
                  id="delivery_time_min"
                  type="number"
                  value={form.delivery_time_min || 0}
                  onChange={(e) =>
                    setForm({ ...form, delivery_time_min: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="delivery_time_max"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Max Delivery Time (min)
                </label>
                <input
                  id="delivery_time_max"
                  type="number"
                  value={form.delivery_time_max || 0}
                  onChange={(e) =>
                    setForm({ ...form, delivery_time_max: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                location_on
              </span>
              <h3 className="text-lg font-extrabold text-[var(--color-on-surface)]">
                Delivery Zones
              </h3>
            </div>
            <p className="text-sm text-[var(--color-outline)]">
              Enter pincodes you deliver to (comma separated)
            </p>
            <input
              type="text"
              value={(form.delivery_zones || []).join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  delivery_zones: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="e.g., 110001, 110002, 110003, 110004"
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 font-mono focus:border-[var(--color-primary)] focus:outline-none"
            />
            {(form.delivery_zones || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.delivery_zones!.map((z, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs font-bold text-[var(--color-on-surface)]"
                  >
                    {z}
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          delivery_zones: form.delivery_zones!.filter((_, j) => j !== i),
                        })
                      }
                      className="ml-2 text-red-400 hover:text-red-600"
                      aria-label={`Remove ${z}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                cancel_schedule_send
              </span>
              <h3 className="text-lg font-extrabold text-[var(--color-on-surface)]">
                Cancellation Policy
              </h3>
            </div>
            <textarea
              value={form.cancellation_policy || ""}
              onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
              placeholder="e.g., Orders can be cancelled within 5 minutes of placing. Full refund will be issued."
              rows={4}
              className="w-full resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
