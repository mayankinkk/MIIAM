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
}

interface MenuItem {
  id?: string;
  name: string;
  price: string;
  category: string;
  image_url?: string;
  isNew?: boolean;
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
  });
  const [vendorMenuItems, setVendorMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({ name: "", price: "", category: "Main Course" });
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
      // Create vendor profile
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
          status: "active",
        }])
        .select();

      if (vendorError) throw vendorError;
      if (!data || data.length === 0) throw new Error("No data returned");
      
      const vendor = data[0];

      // Add menu items
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
      });
      setMenuItems([{ name: "", price: "", category: "Main Course" }]);
      loadVendors();
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      const msg = error?.message || error?.error_description || JSON.stringify(error);
      alert(`Failed to create vendor: ${msg}`);
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
    });
    await loadVendorMenuItems(vendor.id);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("food-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("food-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        const updated = [...vendorMenuItems];
        updated[index].image_url = imageUrl;
        setVendorMenuItems(updated);
      }
    } finally {
      setUploading(false);
    }
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
      });
      
      if (error) throw error;
      
      setNewMenuItem({ name: "", price: "", category: "Main Course" });
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
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Menu Items</h3>
                
                <div className="space-y-3 mb-4">
                  {vendorMenuItems.map((item, index) => (
                    <div key={item.id || index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined">restaurant</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category} • ₹{item.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.id && handleDeleteMenuItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>

<div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Add New Menu Item</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#ba001c] cursor-pointer">
                      {newMenuItem.image_url ? (
                        <img src={newMenuItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <label className="cursor-pointer w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewMenuItem({ ...newMenuItem, image_url: ev.target?.result as string });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        placeholder="Item name"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newMenuItem.category}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                          className="p-2 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Main Course">Main Course</option>
                          <option value="Starters">Starters</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                          <input
                            type="number"
                            value={newMenuItem.price}
                            onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                            className="w-full pl-6 p-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="Price"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewMenuItem}
                    disabled={loading || !newMenuItem.name || !newMenuItem.price}
                    className="w-full py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold disabled:opacity-50"
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
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuisine</th>
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
                    <td className="p-4 text-slate-500">{vendor.cuisine}</td>
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
    </div>
  );
}