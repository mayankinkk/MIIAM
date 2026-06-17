"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import ImageUpload from "@/components/ImageUpload";

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
}

export default function AdminVendorsPage() {
  const supabase = createClient();
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

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const { data } = await supabase
      .from("vendors")
      .select("*")
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
        .insert([{
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
          delivery_time_min: vendorForm.deliveryTimeMin ? parseInt(vendorForm.deliveryTimeMin) : null,
          delivery_time_max: vendorForm.deliveryTimeMax ? parseInt(vendorForm.deliveryTimeMax) : null,
          is_pure_veg: vendorForm.isPureVeg,
          status: "active",
        }])
        .select();

      if (vendorError) throw vendorError;
      if (!data || data.length === 0) throw new Error("No data returned");
      
      // Update profile role if user_id was found
      if (userId) {
        await supabase
          .from("profiles")
          .update({ role: "vendor" })
          .eq("id", userId);
      }
      
      const vendor = data[0];

      const menuData = menuItems
        .filter(item => item.name && item.price)
        .map(item => ({
          vendor_id: vendor.id,
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
        }));

      if (menuData.length > 0) {
        const { error: menuError } = await supabase
          .from("menu_items")
          .insert(menuData);

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
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      useToastStore.getState().addToast(`Failed to create vendor: ${error?.message || JSON.stringify(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Delete "${vendor.shop_name}" and all their menu items? This cannot be undone.`)) return;
    setLoading(true);
    try {
      // Delete menu items first (in case no cascade set)
      await supabase.from("menu_items").delete().eq("vendor_id", vendor.id);
      const { error } = await supabase.from("vendors").delete().eq("id", vendor.id);
      if (error) throw error;
      setVendors(vendors.filter(v => v.id !== vendor.id));
      useToastStore.getState().addToast("Vendor deleted.", "success");
    } catch (error: any) {
      useToastStore.getState().addToast(`Failed to delete: ${error.message}`, "error");
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
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      useToastStore.getState().addToast(`Failed to update vendor: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadVendorMenuItems = async (vendorId: string) => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendorId);
    if (data) setVendorMenuItems(data.map((item: { id: string; vendor_id: string; name: string; price: number; category: string; image_url: string | null; description: string | null; is_veg: boolean | null; is_featured: boolean | null }) => ({ ...item, isNew: false })));
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
    } catch (error: any) {
      console.error("Error adding menu item:", error);
      useToastStore.getState().addToast(`Failed to add menu item: ${error.message}`, "error");
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
      
      setVendorMenuItems(vendorMenuItems.filter(item => item.id !== id));
      useToastStore.getState().addToast("Menu item deleted!", "success");
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      useToastStore.getState().addToast(`Failed to delete: ${error.message}`, "error");
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
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      useToastStore.getState().addToast(`Failed to update menu item: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Vendors</h1>
        <button
          onClick={() => setShowAddVendor(true)}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all"
        >
          + Add Vendor
        </button>
      </div>

      {showAddVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">Create Vendor Profile</h2>
              <button
                onClick={() => setShowAddVendor(false)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Owner Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.ownerName}
                      onChange={(e) => setVendorForm({ ...vendorForm, ownerName: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Shop Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Restaurant Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.shopName}
                      onChange={(e) => setVendorForm({ ...vendorForm, shopName: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Enter restaurant/shop name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Full Address *</label>
                    <textarea
                      required
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="House/Flat No., Building, Street, Area"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">City *</label>
                    <input
                      required
                      type="text"
                      value={vendorForm.city}
                      onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Mumbai"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">State *</label>
                    <input
                      type="text"
                      value={vendorForm.state}
                      onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">PIN Code *</label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={vendorForm.pincode}
                      onChange={(e) => setVendorForm({ ...vendorForm, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 110001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Landmark</label>
                    <input
                      type="text"
                      value={vendorForm.landmark}
                      onChange={(e) => setVendorForm({ ...vendorForm, landmark: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Near Metro Station"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={vendorForm.latitude}
                      onChange={(e) => setVendorForm({ ...vendorForm, latitude: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 28.6139"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={vendorForm.longitude}
                      onChange={(e) => setVendorForm({ ...vendorForm, longitude: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 77.2090"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Cuisine Type *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.cuisine}
                      onChange={(e) => setVendorForm({ ...vendorForm, cuisine: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. North Indian, Chinese, Italian"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={vendorForm.isPureVeg}
                        onChange={(e) => setVendorForm({ ...vendorForm, isPureVeg: e.target.checked })}
                        className="rounded text-green-600"
                      />
                      Pure Veg Restaurant
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Business Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">GST Number</label>
                    <input
                      type="text"
                      value={vendorForm.gstNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none uppercase"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">PAN Number</label>
                    <input
                      type="text"
                      value={vendorForm.panNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none uppercase"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">FSSAI License</label>
                    <input
                      type="text"
                      value={vendorForm.fssaiNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, fssaiNumber: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="12345678901234"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Delivery Settings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Min Order (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                      <input
                        type="number"
                        value={vendorForm.minOrderAmount}
                        onChange={(e) => setVendorForm({ ...vendorForm, minOrderAmount: e.target.value })}
                        className="w-full p-3 pl-7 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Delivery Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                      <input
                        type="number"
                        value={vendorForm.deliveryCharge}
                        onChange={(e) => setVendorForm({ ...vendorForm, deliveryCharge: e.target.value })}
                        className="w-full p-3 pl-7 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Min Delivery Time (min)</label>
                    <input
                      type="number"
                      value={vendorForm.deliveryTimeMin}
                      onChange={(e) => setVendorForm({ ...vendorForm, deliveryTimeMin: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Max Delivery Time (min)</label>
                    <input
                      type="number"
                      value={vendorForm.deliveryTimeMax}
                      onChange={(e) => setVendorForm({ ...vendorForm, deliveryTimeMax: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs">Menu Items</h3>
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="text-[var(--color-primary)] text-xs font-bold hover:underline"
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
                        className="p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
                        className="flex-1 p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Item name"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleMenuChange(index, "price", e.target.value)}
                          className="w-24 p-3 pl-7 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
                  className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-subtle)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">Edit Vendor Profile</h2>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Owner Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Shop Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.shopName}
                      onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Cuisine Type</label>
                    <input
                      type="text"
                      value={editForm.cuisine}
                      onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Shop Address *</label>
                    <textarea
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">City *</label>
                    <input
                      required
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. Delhi, Mumbai"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">PIN Code *</label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 110001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">GST Number</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={editForm.minOrderAmount}
                      onChange={(e) => setEditForm({ ...editForm, minOrderAmount: Number(e.target.value) })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Delivery Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                      <input
                        type="number"
                        value={editForm.deliveryCharge}
                        onChange={(e) => setEditForm({ ...editForm, deliveryCharge: e.target.value })}
                        className="w-full p-3 pl-7 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Min Delivery Time (min)</label>
                    <input
                      type="number"
                      value={editForm.deliveryTimeMin}
                      onChange={(e) => setEditForm({ ...editForm, deliveryTimeMin: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Max Delivery Time (min)</label>
                    <input
                      type="number"
                      value={editForm.deliveryTimeMax}
                      onChange={(e) => setEditForm({ ...editForm, deliveryTimeMax: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Restaurant Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Brief description of the restaurant..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Opening Hours</label>
                    <input
                      type="text"
                      value={editForm.openingHours}
                      onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="e.g. 10:00 AM – 11:00 PM"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Promotional Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center justify-between p-4 bg-amber-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-amber-200 transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.isFeatured}
                      onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--color-on-surface)]">Featured</p>
                        <p className="text-xs text-[var(--color-outline)]">Spotlight section</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isFeatured ? "bg-amber-500" : "bg-[var(--color-surface-container-high)]"}`}>
                      <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${editForm.isFeatured ? "translate-x-5" : ""}`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-purple-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-purple-200 transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.isPromoted}
                      onChange={(e) => setEditForm({ ...editForm, isPromoted: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600">verified</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--color-on-surface)]">Promoted</p>
                        <p className="text-xs text-[var(--color-outline)]">Promoted section</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isPromoted ? "bg-purple-500" : "bg-[var(--color-surface-container-high)]"}`}>
                      <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${editForm.isPromoted ? "translate-x-5" : ""}`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-green-200 transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.isNew}
                      onChange={(e) => setEditForm({ ...editForm, isNew: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600">new_label</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[var(--color-on-surface)]">New</p>
                        <p className="text-xs text-[var(--color-outline)]">New badge</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isNew ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}>
                      <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${editForm.isNew ? "translate-x-5" : ""}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-4">Menu Items</h3>
                
                <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
                  {vendorMenuItems.map((item, index) => (
                    <div key={item.id || index} className="flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-xl hover:bg-[var(--color-surface-container)] transition-colors">
                      <div className="w-14 h-14 bg-[var(--color-surface-container-high)] rounded-lg overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-outline-variant)]">
                            <span className="material-symbols-outlined text-xl">restaurant</span>
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 border border-white rounded-full flex items-center justify-center ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-[var(--color-on-surface)] truncate">{item.name}</p>
                          {item.is_featured && (
                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-outline-variant)]">{item.category} • <span className="text-green-600 font-bold">₹{item.price}</span></p>
                        {item.description && (
                          <p className="text-[10px] text-[var(--color-outline)] truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMenuItem(item)}
                          className="p-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
                          title="Edit details"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => item.id && handleDeleteMenuItem(item.id)}
                          className="p-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] text-red-500 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl space-y-3">
                  <p className="text-xs font-black text-[var(--color-on-surface)] mb-2 uppercase tracking-wider">Add New Menu Item</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Item name *"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] text-sm">₹</span>
                        <input
                          type="number"
                          value={newMenuItem.price}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                          className="w-full pl-6 p-2.5 border border-[var(--color-border-subtle)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          placeholder="Price *"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newMenuItem.category}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                        className="p-2.5 border border-[var(--color-border-subtle)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:outline-none h-[42px]"
                      >
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>

                      <div>
                        <label className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)] transition-all text-[var(--color-on-surface-variant)] font-bold px-3 py-2.5 rounded-lg cursor-pointer text-xs flex items-center justify-center gap-1.5 h-[42px] min-w-0">
                          <span className="material-symbols-outlined text-sm flex-shrink-0">upload</span>
                          <span className="truncate">{newMenuItem.image_url ? "Image Selected" : "Upload Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewMenuItem({ ...(newMenuItem as any), image_url: URL.createObjectURL(file) });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => setNewMenuItem({ ...(newMenuItem as any), _showUrl: !(newMenuItem as any)._showUrl })}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        {(newMenuItem as any)._showUrl ? "Hide URL" : "Or enter URL"}
                      </button>
                      {(newMenuItem as any)._showUrl && (
                        <input
                          type="url"
                          value={newMenuItem.image_url}
                          onChange={(e) => setNewMenuItem({ ...(newMenuItem as any), image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 w-full p-2.5 border border-[var(--color-border-subtle)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        />
                      )}
                    </div>

                    <input
                      type="text"
                      value={newMenuItem.description || ""}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                      className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-lg text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      placeholder="Brief description / ingredients"
                    />

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuItem.is_veg ?? true}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, is_veg: e.target.checked })}
                          className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">Veg / Green Badge</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuItem.is_featured ?? false}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, is_featured: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">⭐ Featured (Chef's Special)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewMenuItem}
                    disabled={loading || !newMenuItem.name || !newMenuItem.price}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-bold hover:bg-[#a00018] disabled:opacity-50 transition-all"
                  >
                    {loading ? "Adding..." : "Add Menu Item"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-subtle)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50">
          <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">All Vendors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Shop Name</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Owner</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Phone</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Delivery</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-outline-variant)]">
                    No vendors found. Click "Add Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="p-4 text-[var(--color-on-surface)] font-bold">{vendor.shop_name}</td>
                    <td className="p-4 text-[var(--color-outline)]">{vendor.owner_name}</td>
                    <td className="p-4 text-[var(--color-outline)]">{vendor.phone}</td>
                    <td className="p-4 text-[var(--color-outline)]">₹{vendor.delivery_charge || 0}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        vendor.status === 'active' ? 'bg-green-100 text-green-700' :
                        vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        vendor.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-[var(--color-surface-container)] text-[var(--color-on-surface)]'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEditClick(vendor)}
                          className="text-[var(--color-primary)] font-bold hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteVendor(vendor)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] overflow-y-auto animate-fade-in">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">Edit Menu Item Details</h3>
              <button
                type="button"
                onClick={() => setEditingMenuItem(null)}
                className="w-11 h-11 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editingMenuItem.name}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                    className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingMenuItem.price}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: e.target.value })}
                    className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={editingMenuItem.category}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value })}
                    className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
                <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={editingMenuItem.description || ""}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                  className="w-full p-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Ingredients, specs, portion size..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMenuItem.is_veg ?? true}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, is_veg: e.target.checked })}
                    className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">Veg / Green Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMenuItem.is_featured ?? false}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, is_featured: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-[var(--color-on-surface-variant)]">⭐ Featured (Chef's Special)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMenuItem(null)}
                  className="flex-1 py-2.5 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-subtle)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
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
