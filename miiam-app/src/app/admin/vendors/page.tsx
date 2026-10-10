"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import ImageUpload from "@/components/ImageUpload";
import BlurImage from "@/components/BlurImage";
import logger from "@/lib/logger";

interface Vendor {
  id: string;
  owner_name: string;
  phone: string;
  email: string;
  shop_name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  cuisine: string;
  gst_number: string;
  pan_number?: string;
  fssai_number?: string;
  status: string;
  delivery_charge?: number;
  min_order_amount?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  is_pure_veg?: boolean;
  is_featured?: boolean;
  is_promoted?: boolean;
  is_new?: boolean;
  cover_image_url?: string;
  description?: string;
  opening_hours?: string;
  rating?: number;
  review_count?: number;
}

interface MenuItem {
  id?: string;
  name: string;
  price: string;
  category: string;
  image_url?: string;
  isNew?: boolean;
  is_veg?: boolean;
  is_featured?: boolean;
  description?: string;
  _showUrl?: boolean;
}

export default function AdminVendorsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    ownerName: "",
    phone: "",
    email: "",
    shopName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    latitude: "",
    longitude: "",
    cuisine: "",
    gstNumber: "",
    panNumber: "",
    fssaiNumber: "",
    deliveryCharge: "",
    minOrderAmount: "",
    deliveryTimeMin: "",
    deliveryTimeMax: "",
    isPureVeg: false,
  });
  const [menuItems, setMenuItems] = useState([{ name: "", price: "", category: "Main Course" }]);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    ownerName: "",
    phone: "",
    email: "",
    shopName: "",
    address: "",
    city: "",
    pincode: "",
    cuisine: "",
    gstNumber: "",
    status: "active",
    minOrderAmount: 0,
    deliveryCharge: "",
    deliveryTimeMin: "",
    deliveryTimeMax: "",
    isFeatured: false,
    isPromoted: false,
    isNew: false,
    coverImageUrl: "",
    description: "",
    openingHours: "",
  });
  const [vendorMenuItems, setVendorMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({
    name: "",
    price: "",
    category: "Main Course",
    image_url: "",
    description: "",
    is_veg: true,
    is_featured: false,
  });
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVendors();

    const channel = supabase
      .channel("vendors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendors" }, () => {
        loadVendors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadVendors = async () => {
    const { data } = await supabase
      .from("vendors")
      .select(
        "id, shop_name, name, owner_name, phone, email, address, city, state, pincode, cuisine, status, rating, review_count, delivery_charge, min_order_amount, delivery_time_min, delivery_time_max, is_featured, is_pure_veg, type, created_at"
      )
      .order("created_at", { ascending: false });
    if (data) setVendors(data);
  };

  const handleAddMenuItem = () => {
    setMenuItems([...menuItems, { name: "", price: "", category: "Main Course" }]);
  };

  const handleMenuChange = (index: number, field: string, value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Look up user_id by email if provided
      let userId: string | null = null;
      if (vendorForm.email) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", vendorForm.email)
          .maybeSingle();
        if (userProfile) userId = userProfile.id;
      }

      const { data, error: vendorError } = await supabase
        .from("vendors")
        .insert([
          {
            owner_name: vendorForm.ownerName,
            phone: vendorForm.phone,
            email: vendorForm.email || null,
            user_id: userId,
            shop_name: vendorForm.shopName,
            address: vendorForm.address,
            city: vendorForm.city || null,
            state: vendorForm.state || null,
            pincode: vendorForm.pincode || null,
            landmark: vendorForm.landmark || null,
            latitude: vendorForm.latitude ? parseFloat(vendorForm.latitude) : null,
            longitude: vendorForm.longitude ? parseFloat(vendorForm.longitude) : null,
            cuisine: vendorForm.cuisine,
            gst_number: vendorForm.gstNumber || null,
            pan_number: vendorForm.panNumber || null,
            fssai_number: vendorForm.fssaiNumber || null,
            delivery_charge: vendorForm.deliveryCharge ? parseFloat(vendorForm.deliveryCharge) : 0,
            min_order_amount: vendorForm.minOrderAmount ? parseFloat(vendorForm.minOrderAmount) : 0,
            delivery_time_min: vendorForm.deliveryTimeMin
              ? parseInt(vendorForm.deliveryTimeMin)
              : null,
            delivery_time_max: vendorForm.deliveryTimeMax
              ? parseInt(vendorForm.deliveryTimeMax)
              : null,
            is_pure_veg: vendorForm.isPureVeg,
            status: "active",
          },
        ])
        .select();

      if (vendorError) throw vendorError;
      if (!data || data.length === 0) throw new Error("No data returned");

      // Update profile role if user_id was found
      if (userId) {
        await supabase.from("profiles").update({ role: "vendor" }).eq("id", userId);
      }

      const vendor = data[0];

      const menuData = menuItems
        .filter((item) => item.name && item.price)
        .map((item) => ({
          vendor_id: vendor.id,
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
        }));

      if (menuData.length > 0) {
        const { error: menuError } = await supabase.from("menu_items").insert(menuData);

        if (menuError) throw menuError;
      }

      useToastStore.getState().addToast("Vendor created successfully!", "success");
      setShowAddVendor(false);
      setVendorForm({
        ownerName: "",
        phone: "",
        email: "",
        shopName: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        latitude: "",
        longitude: "",
        cuisine: "",
        gstNumber: "",
        panNumber: "",
        fssaiNumber: "",
        deliveryCharge: "",
        minOrderAmount: "",
        deliveryTimeMin: "",
        deliveryTimeMax: "",
        isPureVeg: false,
      });
      setMenuItems([{ name: "", price: "", category: "Main Course" }]);
      loadVendors();
    } catch (error: unknown) {
      logger.error({ err: error }, "Error creating vendor");
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      useToastStore.getState().addToast(`Failed to create vendor: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Delete "${vendor.shop_name}" and all their menu items? This cannot be undone.`))
      return;
    setLoading(true);
    try {
      // Delete menu items first (in case no cascade set)
      await supabase.from("menu_items").delete().eq("vendor_id", vendor.id);
      const { error } = await supabase.from("vendors").delete().eq("id", vendor.id);
      if (error) throw error;
      setVendors(vendors.filter((v) => v.id !== vendor.id));
      useToastStore.getState().addToast("Vendor deleted.", "success");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to delete: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          owner_name: editForm.ownerName,
          phone: editForm.phone,
          email: editForm.email,
          shop_name: editForm.shopName,
          address: editForm.address,
          pincode: editForm.pincode || null,
          cuisine: editForm.cuisine,
          gst_number: editForm.gstNumber,
          status: editForm.status,
          delivery_charge: editForm.deliveryCharge ? parseFloat(editForm.deliveryCharge) : 0,
          min_order_amount: editForm.minOrderAmount,
          delivery_time_min: editForm.deliveryTimeMin ? parseInt(editForm.deliveryTimeMin) : null,
          delivery_time_max: editForm.deliveryTimeMax ? parseInt(editForm.deliveryTimeMax) : null,
          is_featured: editForm.isFeatured,
          is_promoted: editForm.isPromoted,
          is_new: editForm.isNew,
          cover_image_url: editForm.coverImageUrl || null,
          description: editForm.description || null,
          opening_hours: editForm.openingHours || null,
        })
        .eq("id", editingVendor.id);

      if (error) throw error;

      // Sync profile role when status changes to active
      if (editForm.status === "active" && editingVendor.email) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", editingVendor.email)
          .maybeSingle();
        if (userProfile) {
          await supabase.from("profiles").update({ role: "vendor" }).eq("id", userProfile.id);
        }
      }

      useToastStore.getState().addToast("Vendor updated successfully!", "success");
      setEditingVendor(null);
      loadVendors();
    } catch (error: unknown) {
      logger.error({ err: error }, "Error updating vendor");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to update vendor: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadVendorMenuItems = async (vendorId: string) => {
    const { data } = await supabase
      .from("menu_items")
      .select("id, vendor_id, name, price, category, image_url, description, is_veg, is_featured")
      .eq("vendor_id", vendorId);
    if (data)
      setVendorMenuItems(
        data.map(
          (item: {
            id: string;
            vendor_id: string;
            name: string;
            price: number;
            category: string;
            image_url: string | null;
            description: string | null;
            is_veg: boolean | null;
            is_featured: boolean | null;
          }) => ({ ...item, isNew: false })
        )
      );
  };

  const handleEditClick = async (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditForm({
      ownerName: vendor.owner_name,
      phone: vendor.phone,
      email: vendor.email || "",
      shopName: vendor.shop_name,
      address: vendor.address,
      city: vendor.city || "",
      pincode: vendor.pincode || "",
      cuisine: vendor.cuisine || "",
      gstNumber: vendor.gst_number || "",
      status: vendor.status,
      deliveryCharge: vendor.delivery_charge?.toString() || "",
      minOrderAmount: vendor.min_order_amount || 0,
      deliveryTimeMin: vendor.delivery_time_min?.toString() || "",
      deliveryTimeMax: vendor.delivery_time_max?.toString() || "",
      isFeatured: vendor.is_featured || false,
      isPromoted: vendor.is_promoted || false,
      isNew: vendor.is_new || false,
      coverImageUrl: vendor.cover_image_url || "",
      description: vendor.description || "",
      openingHours: vendor.opening_hours || "",
    });
    await loadVendorMenuItems(vendor.id);
  };

  const handleAddNewMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !newMenuItem.name || !newMenuItem.price) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("menu_items").insert({
        vendor_id: editingVendor.id,
        name: newMenuItem.name,
        price: parseFloat(newMenuItem.price),
        category: newMenuItem.category,
        image_url: newMenuItem.image_url || null,
        description: newMenuItem.description || null,
        is_veg: newMenuItem.is_veg ?? true,
        is_featured: newMenuItem.is_featured ?? false,
      });

      if (error) throw error;

      setNewMenuItem({
        name: "",
        price: "",
        category: "Main Course",
        image_url: "",
        description: "",
        is_veg: true,
        is_featured: false,
      });
      await loadVendorMenuItems(editingVendor.id);
      useToastStore.getState().addToast("Menu item added!", "success");
    } catch (error: unknown) {
      logger.error({ err: error }, "Error adding menu item");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to add menu item: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;

      setVendorMenuItems(vendorMenuItems.filter((item) => item.id !== id));
      useToastStore.getState().addToast("Menu item deleted!", "success");
    } catch (error: unknown) {
      logger.error({ err: error }, "Error deleting menu item");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to delete: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !editingMenuItem || !editingMenuItem.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editingMenuItem.name,
          price: parseFloat(editingMenuItem.price),
          category: editingMenuItem.category,
          image_url: editingMenuItem.image_url || null,
          description: editingMenuItem.description || null,
          is_veg: editingMenuItem.is_veg ?? true,
          is_featured: editingMenuItem.is_featured ?? false,
        })
        .eq("id", editingMenuItem.id);

      if (error) throw error;

      await loadVendorMenuItems(editingVendor.id);
      setEditingMenuItem(null);
      useToastStore.getState().addToast("Menu item updated!", "success");
    } catch (error: unknown) {
      logger.error({ err: error }, "Error updating menu item");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to update menu item: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  function toggleSelectAll() {
    if (selectedIds.size === vendors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vendors.map((v) => v.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exportToCSV() {
    const headers = [
      "Shop Name",
      "Owner",
      "Phone",
      "Email",
      "Cuisine",
      "Status",
      "Delivery Charge",
      "City",
      "GST Number",
    ];
    const rows = vendors
      .filter((v) => selectedIds.size === 0 || selectedIds.has(v.id))
      .map((v) => [
        v.shop_name,
        v.owner_name,
        v.phone,
        v.email || "",
        v.cuisine,
        v.status,
        v.delivery_charge || 0,
        v.city || "",
        v.gst_number,
      ]);
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csv = [headers, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function bulkSuspend() {
    if (!confirm(`Suspend ${selectedIds.size} vendors?`)) return;
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          supabase.from("vendors").update({ status: "suspended" }).eq("id", id)
        )
      );
      useToastStore.getState().addToast(`${selectedIds.size} vendors suspended`, "success");
      setSelectedIds(new Set());
      loadVendors();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to suspend vendors: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Vendors</h1>
        <button
          onClick={() => setShowAddVendor(true)}
          className="text-on-primary hover:bg-primary-dim rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold transition-all"
        >
          + Add Vendor
        </button>
      </div>

      {showAddVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)] p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                Create Vendor Profile
              </h2>
              <button
                onClick={() => setShowAddVendor(false)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Owner Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="create-owner-name"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Owner Name *
                    </label>
                    <input
                      id="create-owner-name"
                      type="text"
                      required
                      value={vendorForm.ownerName}
                      onChange={(e) => setVendorForm({ ...vendorForm, ownerName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-phone"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="create-phone"
                      type="tel"
                      required
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-email"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Email Address
                    </label>
                    <input
                      id="create-email"
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Shop Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="create-shop-name"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Restaurant Name *
                    </label>
                    <input
                      id="create-shop-name"
                      type="text"
                      required
                      value={vendorForm.shopName}
                      onChange={(e) => setVendorForm({ ...vendorForm, shopName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter restaurant/shop name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="create-address"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Full Address *
                    </label>
                    <textarea
                      id="create-address"
                      required
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="House/Flat No., Building, Street, Area"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-city"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      City *
                    </label>
                    <input
                      id="create-city"
                      required
                      type="text"
                      value={vendorForm.city}
                      onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Mumbai"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-state"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      State *
                    </label>
                    <input
                      id="create-state"
                      type="text"
                      value={vendorForm.state}
                      onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Maharashtra"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-pincode"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      PIN Code *
                    </label>
                    <input
                      id="create-pincode"
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={vendorForm.pincode}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, pincode: e.target.value.replace(/\D/g, "") })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 110001"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-landmark"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Landmark
                    </label>
                    <input
                      id="create-landmark"
                      type="text"
                      value={vendorForm.landmark}
                      onChange={(e) => setVendorForm({ ...vendorForm, landmark: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Near Metro Station"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-latitude"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Latitude
                    </label>
                    <input
                      id="create-latitude"
                      type="number"
                      step="any"
                      value={vendorForm.latitude}
                      onChange={(e) => setVendorForm({ ...vendorForm, latitude: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 28.6139"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-longitude"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Longitude
                    </label>
                    <input
                      id="create-longitude"
                      type="number"
                      step="any"
                      value={vendorForm.longitude}
                      onChange={(e) => setVendorForm({ ...vendorForm, longitude: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 77.2090"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-cuisine"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Cuisine Type *
                    </label>
                    <input
                      id="create-cuisine"
                      type="text"
                      required
                      value={vendorForm.cuisine}
                      onChange={(e) => setVendorForm({ ...vendorForm, cuisine: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. North Indian, Chinese, Italian"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-pure-veg"
                      className="mb-1 flex items-center gap-2 text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      <input
                        id="create-pure-veg"
                        type="checkbox"
                        checked={vendorForm.isPureVeg}
                        onChange={(e) =>
                          setVendorForm({ ...vendorForm, isPureVeg: e.target.checked })
                        }
                        className="rounded text-green-600"
                      />
                      Pure Veg Restaurant
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Business Documents
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="create-gst"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      GST Number
                    </label>
                    <input
                      id="create-gst"
                      type="text"
                      value={vendorForm.gstNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm uppercase focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-pan"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      PAN Number
                    </label>
                    <input
                      id="create-pan"
                      type="text"
                      value={vendorForm.panNumber}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, panNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm uppercase focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-fssai"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      FSSAI License
                    </label>
                    <input
                      id="create-fssai"
                      type="text"
                      value={vendorForm.fssaiNumber}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, fssaiNumber: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="12345678901234"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Delivery Settings
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <label
                      htmlFor="create-min-order"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Min Order (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                        ₹
                      </span>
                      <input
                        id="create-min-order"
                        type="number"
                        value={vendorForm.minOrderAmount}
                        onChange={(e) =>
                          setVendorForm({ ...vendorForm, minOrderAmount: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="create-delivery-charge"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Delivery Charge (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                        ₹
                      </span>
                      <input
                        id="create-delivery-charge"
                        type="number"
                        value={vendorForm.deliveryCharge}
                        onChange={(e) =>
                          setVendorForm({ ...vendorForm, deliveryCharge: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="create-delivery-time-min"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Min Delivery Time (min)
                    </label>
                    <input
                      id="create-delivery-time-min"
                      type="number"
                      value={vendorForm.deliveryTimeMin}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, deliveryTimeMin: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="create-delivery-time-max"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Max Delivery Time (min)
                    </label>
                    <input
                      id="create-delivery-time-max"
                      type="number"
                      value={vendorForm.deliveryTimeMax}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, deliveryTimeMax: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                    Menu Items
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {menuItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleMenuChange(index, "category", e.target.value)}
                        className="rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleMenuChange(index, "name", e.target.value)}
                        className="flex-1 rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Item name"
                      />
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleMenuChange(index, "price", e.target.value)}
                          className="w-24 rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      {menuItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddVendor(false)}
                  className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold transition-all hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-on-primary hover:bg-primary-dim flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)] p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                Edit Vendor Profile
              </h2>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Owner Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-owner-name"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Owner Name *
                    </label>
                    <input
                      id="edit-owner-name"
                      type="text"
                      required
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-phone"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="edit-phone"
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Email Address
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Shop Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-shop-name"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Shop Name *
                    </label>
                    <input
                      id="edit-shop-name"
                      type="text"
                      required
                      value={editForm.shopName}
                      onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-cuisine"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Cuisine Type
                    </label>
                    <input
                      id="edit-cuisine"
                      type="text"
                      value={editForm.cuisine}
                      onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit-address"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Shop Address *
                    </label>
                    <textarea
                      id="edit-address"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-city"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      City *
                    </label>
                    <input
                      id="edit-city"
                      required
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Mumbai"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-pincode"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      PIN Code *
                    </label>
                    <input
                      id="edit-pincode"
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={editForm.pincode}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "") })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 110001"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-gst"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      GST Number
                    </label>
                    <input
                      id="edit-gst"
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-min-order"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Min Order Amount (₹)
                    </label>
                    <input
                      id="edit-min-order"
                      type="number"
                      value={editForm.minOrderAmount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minOrderAmount: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-delivery-charge"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Delivery Charge (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                        ₹
                      </span>
                      <input
                        id="edit-delivery-charge"
                        type="number"
                        value={editForm.deliveryCharge}
                        onChange={(e) =>
                          setEditForm({ ...editForm, deliveryCharge: e.target.value })
                        }
                        className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 pl-7 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-delivery-time-min"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Min Delivery Time (min)
                    </label>
                    <input
                      id="edit-delivery-time-min"
                      type="number"
                      value={editForm.deliveryTimeMin}
                      onChange={(e) =>
                        setEditForm({ ...editForm, deliveryTimeMin: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-delivery-time-max"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Max Delivery Time (min)
                    </label>
                    <input
                      id="edit-delivery-time-max"
                      type="number"
                      value={editForm.deliveryTimeMax}
                      onChange={(e) =>
                        setEditForm({ ...editForm, deliveryTimeMax: e.target.value })
                      }
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 45"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ImageUpload
                      value={editForm.coverImageUrl}
                      onChange={(url) => setEditForm({ ...editForm, coverImageUrl: url })}
                      bucket="grocery-images"
                      folder="food-vendor-images"
                      label="Cover Image"
                      previewHeight="h-24"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit-description"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Restaurant Description
                    </label>
                    <textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Brief description of the restaurant..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-opening-hours"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Opening Hours
                    </label>
                    <input
                      id="edit-opening-hours"
                      type="text"
                      value={editForm.openingHours}
                      onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 10:00 AM – 11:00 PM"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-status"
                      className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Status
                    </label>
                    <select
                      id="edit-status"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Promotional Options
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label
                    htmlFor="edit-is-featured"
                    className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-transparent bg-amber-50 p-4 transition-all hover:border-amber-200"
                  >
                    <input
                      id="edit-is-featured"
                      type="checkbox"
                      onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <span
                          className="material-symbols-outlined text-amber-600"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">Featured</p>
                        <p className="text-xs text-[var(--color-outline)]">Spotlight section</p>
                      </div>
                    </div>
                    <div
                      className={`h-7 w-12 rounded-full p-1 transition-colors ${editForm.isFeatured ? "bg-amber-500" : "bg-[var(--color-surface-container-high)]"}`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${editForm.isFeatured ? "translate-x-5" : ""}`}
                      />
                    </div>
                  </label>

                  <label
                    htmlFor="edit-is-promoted"
                    className="bg-accent/10 hover:border-accent/20 flex cursor-pointer items-center justify-between rounded-xl border-2 border-transparent p-4 transition-all"
                  >
                    <input
                      id="edit-is-promoted"
                      type="checkbox"
                      onChange={(e) => setEditForm({ ...editForm, isPromoted: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-accent">verified</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">Promoted</p>
                        <p className="text-xs text-[var(--color-outline)]">Promoted section</p>
                      </div>
                    </div>
                    <div
                      className={`h-7 w-12 rounded-full p-1 transition-colors ${editForm.isPromoted ? "bg-accent" : "bg-[var(--color-surface-container-high)]"}`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${editForm.isPromoted ? "translate-x-5" : ""}`}
                      />
                    </div>
                  </label>

                  <label
                    htmlFor="edit-is-new"
                    className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-transparent bg-green-50 p-4 transition-all hover:border-green-200"
                  >
                    <input
                      id="edit-is-new"
                      type="checkbox"
                      onChange={(e) => setEditForm({ ...editForm, isNew: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <span className="material-symbols-outlined text-green-600">new_label</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">New</p>
                        <p className="text-xs text-[var(--color-outline)]">New badge</p>
                      </div>
                    </div>
                    <div
                      className={`h-7 w-12 rounded-full p-1 transition-colors ${editForm.isNew ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${editForm.isNew ? "translate-x-5" : ""}`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Menu Items
                </h3>

                <div className="mb-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
                  {vendorMenuItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-3 transition-colors hover:bg-[var(--color-surface-container)]"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface-container-high)]">
                        {item.image_url ? (
                          <BlurImage
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--color-outline-variant)]">
                            <span className="material-symbols-outlined text-xl">restaurant</span>
                          </div>
                        )}
                        <span
                          className={`absolute right-0.5 bottom-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-white ${item.is_veg ? "bg-green-500" : "bg-red-500"}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-[var(--color-on-surface)]">
                            {item.name}
                          </p>
                          {item.is_featured && (
                            <span
                              className="material-symbols-outlined text-sm text-amber-500"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-outline-variant)]">
                          {item.category} •{" "}
                          <span className="font-bold text-green-600">₹{item.price}</span>
                        </p>
                        {item.description && (
                          <p className="mt-0.5 truncate text-[10px] text-[var(--color-outline)]">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMenuItem(item)}
                          className="flex items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-1.5 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          title="Edit details"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => item.id && handleDeleteMenuItem(item.id)}
                          className="flex items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-1.5 text-red-500 transition-all hover:bg-red-50"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                  <p className="mb-2 text-xs font-black tracking-wider text-[var(--color-on-surface)] uppercase">
                    Add New Menu Item
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Item name *"
                      />
                      <div className="relative">
                        <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-[var(--color-outline-variant)]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={newMenuItem.price}
                          onChange={(e) =>
                            setNewMenuItem({ ...newMenuItem, price: e.target.value })
                          }
                          className="w-full rounded-lg border border-[var(--color-border-subtle)] p-2.5 pl-6 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          placeholder="Price *"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newMenuItem.category}
                        onChange={(e) =>
                          setNewMenuItem({ ...newMenuItem, category: e.target.value })
                        }
                        className="h-[42px] rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>

                      <div>
                        <label className="flex h-[42px] min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2.5 text-xs font-bold text-[var(--color-on-surface-variant)] transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)]">
                          <span className="material-symbols-outlined flex-shrink-0 text-sm">
                            upload
                          </span>
                          <span className="truncate">
                            {newMenuItem.image_url ? "Image Selected" : "Upload Image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewMenuItem({
                                  ...newMenuItem,
                                  image_url: URL.createObjectURL(file),
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setNewMenuItem({ ...newMenuItem, _showUrl: !newMenuItem._showUrl })
                        }
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        {newMenuItem._showUrl ? "Hide URL" : "Or enter URL"}
                      </button>
                      {newMenuItem._showUrl && (
                        <input
                          type="url"
                          value={newMenuItem.image_url}
                          onChange={(e) =>
                            setNewMenuItem({ ...newMenuItem, image_url: e.target.value })
                          }
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        />
                      )}
                    </div>

                    <input
                      type="text"
                      value={newMenuItem.description || ""}
                      onChange={(e) =>
                        setNewMenuItem({ ...newMenuItem, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Brief description / ingredients"
                    />

                    <div className="flex gap-4">
                      <label
                        htmlFor="new-menu-item-veg"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          id="new-menu-item-veg"
                          onChange={(e) =>
                            setNewMenuItem({ ...newMenuItem, is_veg: e.target.checked })
                          }
                          className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">
                          Veg / Green Badge
                        </span>
                      </label>

                      <label
                        htmlFor="new-menu-item-featured"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          id="new-menu-item-featured"
                          onChange={(e) =>
                            setNewMenuItem({ ...newMenuItem, is_featured: e.target.checked })
                          }
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">
                          ⭐ Featured (Chef's Special)
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewMenuItem}
                    disabled={loading || !newMenuItem.name || !newMenuItem.price}
                    className="text-on-primary w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-bold transition-all hover:bg-[#a00018] disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Menu Item"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold transition-all hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-on-primary hover:bg-primary-dim flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <h2 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            All Vendors
          </h2>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs font-bold text-[var(--color-outline-variant)]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={bulkSuspend}
                  className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  Bulk Suspend
                </button>
              </>
            )}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="w-10 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === vendors.length && vendors.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Shop Name
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Owner
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Phone
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Delivery
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--color-outline-variant)]">
                    No vendors found. Click "Add Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(vendor.id)}
                        onChange={() => toggleSelect(vendor.id)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                    </td>
                    <td className="p-4 font-bold text-[var(--color-on-surface)]">
                      {vendor.shop_name}
                    </td>
                    <td className="p-4 text-[var(--color-outline)]">{vendor.owner_name}</td>
                    <td className="p-4 text-[var(--color-outline)]">{vendor.phone}</td>
                    <td className="p-4 text-[var(--color-outline)]">
                      ₹{vendor.delivery_charge || 0}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          vendor.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : vendor.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : vendor.status === "suspended"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditClick(vendor)}
                          className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor)}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingMenuItem && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="animate-scale-up mx-4 w-full max-w-md rounded-3xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">
                Edit Menu Item Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingMenuItem(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-container)] text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-menu-item-name"
                    className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-outline)] uppercase"
                  >
                    Item Name *
                  </label>
                  <input
                    id="edit-menu-item-name"
                    type="text"
                    required
                    value={editingMenuItem.name}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-menu-item-price"
                    className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-outline)] uppercase"
                  >
                    Price (₹) *
                  </label>
                  <input
                    id="edit-menu-item-price"
                    type="number"
                    required
                    value={editingMenuItem.price}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, price: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-menu-item-category"
                    className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-outline)] uppercase"
                  >
                    Category
                  </label>
                  <select
                    id="edit-menu-item-category"
                    value={editingMenuItem.category}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
                <ImageUpload
                  value={editingMenuItem.image_url || ""}
                  onChange={(url) => setEditingMenuItem({ ...editingMenuItem, image_url: url })}
                  bucket="grocery-images"
                  folder="food-vendor-images"
                  label="Food Image"
                  previewHeight="h-20"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-menu-item-description"
                  className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-outline)] uppercase"
                >
                  Description
                </label>
                <textarea
                  id="edit-menu-item-description"
                  value={editingMenuItem.description || ""}
                  onChange={(e) =>
                    setEditingMenuItem({ ...editingMenuItem, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Ingredients, specs, portion size..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label
                  htmlFor="edit-menu-item-veg"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    id="edit-menu-item-veg"
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, is_veg: e.target.checked })
                    }
                    className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">
                    Veg / Green Badge
                  </span>
                </label>

                <label
                  htmlFor="edit-menu-item-featured"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    id="edit-menu-item-featured"
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, is_featured: e.target.checked })
                    }
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">
                    ⭐ Featured (Chef's Special)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMenuItem(null)}
                  className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-2.5 text-sm font-bold transition-all hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-on-primary hover:bg-primary-dim flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
