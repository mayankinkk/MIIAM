"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Vendor {
  id: string;
  owner_name: string;
  phone: string;
  email: string;
  shop_name: string;
  address: string;
  cuisine: string;
  gst_number: string;
  status: string;
  delivery_charge?: number;
  is_featured?: boolean;
  is_promoted?: boolean;
  is_new?: boolean;
  cover_image_url?: string;
  description?: string;
  opening_hours?: string;
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
    cuisine: "",
    gstNumber: "",
    deliveryCharge: "",
  });
  const [menuItems, setMenuItems] = useState([{ name: "", price: "", category: "Main Course" }]);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    ownerName: "",
    phone: "",
    email: "",
    shopName: "",
    address: "",
    cuisine: "",
    gstNumber: "",
    status: "active",
    deliveryCharge: "",
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
  const [uploading, setUploading] = useState(false);

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
      const { data, error: vendorError } = await supabase
        .from("vendors")
        .insert([{
          owner_name: vendorForm.ownerName,
          phone: vendorForm.phone,
          email: vendorForm.email,
          shop_name: vendorForm.shopName,
          address: vendorForm.address,
          cuisine: vendorForm.cuisine,
          gst_number: vendorForm.gstNumber,
          delivery_charge: vendorForm.deliveryCharge ? parseFloat(vendorForm.deliveryCharge) : 0,
          status: "active",
        }])
        .select();

      if (vendorError) throw vendorError;
      if (!data || data.length === 0) throw new Error("No data returned");
      
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

      alert("Vendor created successfully!");
      setShowAddVendor(false);
      setVendorForm({
        ownerName: "",
        phone: "",
        email: "",
        shopName: "",
        address: "",
        cuisine: "",
        gstNumber: "",
        deliveryCharge: "",
      });
      setMenuItems([{ name: "", price: "", category: "Main Course" }]);
      loadVendors();
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      alert(`Failed to create vendor: ${error?.message || JSON.stringify(error)}`);
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
          cuisine: editForm.cuisine,
          gst_number: editForm.gstNumber,
          status: editForm.status,
          delivery_charge: editForm.deliveryCharge ? parseFloat(editForm.deliveryCharge) : 0,
          is_featured: editForm.isFeatured,
          is_promoted: editForm.isPromoted,
          is_new: editForm.isNew,
          cover_image_url: editForm.coverImageUrl || null,
          description: editForm.description || null,
          opening_hours: editForm.openingHours || null,
        })
        .eq("id", editingVendor.id);

      if (error) throw error;

      alert("Vendor updated successfully!");
      setEditingVendor(null);
      loadVendors();
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      alert(`Failed to update vendor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorMenuItems = async (vendorId: string) => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendorId);
    if (data) setVendorMenuItems(data.map(item => ({ ...item, isNew: false })));
  };

  const handleEditClick = async (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditForm({
      ownerName: vendor.owner_name,
      phone: vendor.phone,
      email: vendor.email || "",
      shopName: vendor.shop_name,
      address: vendor.address,
      cuisine: vendor.cuisine || "",
      gstNumber: vendor.gst_number || "",
      status: vendor.status,
      deliveryCharge: vendor.delivery_charge?.toString() || "",
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
      alert("Menu item added!");
    } catch (error: any) {
      console.error("Error adding menu item:", error);
      alert(`Failed to add menu item: ${error.message}`);
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
      alert("Menu item deleted!");
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      alert(`Failed to delete: ${error.message}`);
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
      alert("Menu item updated!");
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      alert(`Failed to update menu item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Vendors</h1>
        <button
          onClick={() => setShowAddVendor(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all"
        >
          + Add Vendor
        </button>
      </div>

      {showAddVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">Create Vendor Profile</h2>
              <button
                onClick={() => setShowAddVendor(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Owner Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.ownerName}
                      onChange={(e) => setVendorForm({ ...vendorForm, ownerName: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Shop Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.shopName}
                      onChange={(e) => setVendorForm({ ...vendorForm, shopName: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter shop name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Cuisine Type *</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.cuisine}
                      onChange={(e) => setVendorForm({ ...vendorForm, cuisine: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="e.g., North Indian, Chinese"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Shop Address *</label>
                    <textarea
                      required
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter full shop address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">GST Number</label>
                    <input
                      type="text"
                      value={vendorForm.gstNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Delivery Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input
                        type="number"
                        value={vendorForm.deliveryCharge}
                        onChange={(e) => setVendorForm({ ...vendorForm, deliveryCharge: e.target.value })}
                        className="w-full p-3 pl-7 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Menu Items</h3>
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="text-[#ba001c] text-xs font-bold hover:underline"
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
                        className="p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
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
                        className="flex-1 p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                        placeholder="Item name"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleMenuChange(index, "price", e.target.value)}
                          className="w-24 p-3 pl-7 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
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
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
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
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">Edit Vendor Profile</h2>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Owner Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Shop Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.shopName}
                      onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Cuisine Type</label>
                    <input
                      type="text"
                      value={editForm.cuisine}
                      onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Shop Address *</label>
                    <textarea
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">GST Number</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Delivery Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <input
                        type="number"
                        value={editForm.deliveryCharge}
                        onChange={(e) => setEditForm({ ...editForm, deliveryCharge: e.target.value })}
                        className="w-full p-3 pl-7 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Cover Image URL</label>
                    <input
                      type="text"
                      value={editForm.coverImageUrl}
                      onChange={(e) => setEditForm({ ...editForm, coverImageUrl: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="https://... (restaurant cover photo)"
                    />
                    {editForm.coverImageUrl && (
                      <div className="mt-2 h-24 rounded-xl overflow-hidden">
                        <img src={editForm.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.opacity = '0.3';}} />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Restaurant Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Brief description of the restaurant..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Opening Hours</label>
                    <input
                      type="text"
                      value={editForm.openingHours}
                      onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="e.g. 10:00 AM – 11:00 PM"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Promotional Options</h3>
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
                        <p className="font-bold text-sm text-slate-800">Featured</p>
                        <p className="text-xs text-slate-500">Spotlight section</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isFeatured ? "bg-amber-500" : "bg-slate-200"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isFeatured ? "translate-x-5" : ""}`} />
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
                        <p className="font-bold text-sm text-slate-800">Promoted</p>
                        <p className="text-xs text-slate-500">Promoted section</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isPromoted ? "bg-purple-500" : "bg-slate-200"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isPromoted ? "translate-x-5" : ""}`} />
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
                        <p className="font-bold text-sm text-slate-800">New</p>
                        <p className="text-xs text-slate-500">New badge</p>
                      </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${editForm.isNew ? "bg-green-500" : "bg-slate-200"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isNew ? "translate-x-5" : ""}`} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Menu Items</h3>
                
                <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
                  {vendorMenuItems.map((item, index) => (
                    <div key={item.id || index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-14 h-14 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-xl">restaurant</span>
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 border border-white rounded-full flex items-center justify-center ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
                          {item.is_featured && (
                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{item.category} • <span className="text-green-600 font-bold">₹{item.price}</span></p>
                        {item.description && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingMenuItem(item)}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:border-[#ba001c] hover:text-[#ba001c] transition-all flex items-center justify-center"
                          title="Edit details"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => item.id && handleDeleteMenuItem(item.id)}
                          className="p-1.5 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">Add New Menu Item</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                        placeholder="Item name *"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                        <input
                          type="number"
                          value={newMenuItem.price}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                          className="w-full pl-6 p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                          placeholder="Price *"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newMenuItem.category}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                        className="p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                      >
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>

                      <input
                        type="text"
                        value={newMenuItem.image_url || ""}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, image_url: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                        placeholder="Food Image URL"
                      />
                    </div>

                    <input
                      type="text"
                      value={newMenuItem.description || ""}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-[#ba001c] focus:outline-none"
                      placeholder="Brief description / ingredients"
                    />

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuItem.is_veg ?? true}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, is_veg: e.target.checked })}
                          className="rounded text-[#ba001c] focus:ring-[#ba001c]"
                        />
                        <span className="text-xs font-bold text-slate-600">Veg / Green Badge</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuItem.is_featured ?? false}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, is_featured: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-600">⭐ Featured (Chef's Special)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewMenuItem}
                    disabled={loading || !newMenuItem.name || !newMenuItem.price}
                    className="w-full py-2.5 bg-[#ba001c] text-white rounded-lg text-sm font-bold hover:bg-[#a00018] disabled:opacity-50 transition-all"
                  >
                    {loading ? "Adding..." : "Add Menu Item"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">All Vendors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No vendors found. Click "Add Vendor" to create one.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 font-bold">{vendor.shop_name}</td>
                    <td className="p-4 text-slate-500">{vendor.owner_name}</td>
                    <td className="p-4 text-slate-500">{vendor.phone}</td>
                    <td className="p-4 text-slate-500">₹{vendor.delivery_charge || 0}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        vendor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleEditClick(vendor)}
                        className="text-[#ba001c] font-bold hover:underline"
                      >
                        Edit
                      </button>
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Edit Menu Item Details</h3>
              <button
                type="button"
                onClick={() => setEditingMenuItem(null)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editingMenuItem.name}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingMenuItem.price}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={editingMenuItem.category}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={editingMenuItem.image_url || ""}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, image_url: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {editingMenuItem.image_url && (
                <div className="h-20 rounded-xl overflow-hidden bg-slate-100">
                  <img src={editingMenuItem.image_url} alt="Food item preview" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.opacity = '0.3';}} />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={editingMenuItem.description || ""}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
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
                    className="rounded text-[#ba001c] focus:ring-[#ba001c]"
                  />
                  <span className="text-xs font-bold text-slate-600">Veg / Green Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMenuItem.is_featured ?? false}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, is_featured: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-600">⭐ Featured (Chef's Special)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMenuItem(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] transition-all disabled:opacity-50"
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
