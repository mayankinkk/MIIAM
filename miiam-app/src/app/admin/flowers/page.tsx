"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const supabase = createClient();

const mockOrders = [
  { id: "FLW001", customer: "Deepak J.", items: "Rose Bouquet (12 roses)", total: 450, status: "delivered", date: "Today, 2:00 PM", type: "bouquet" },
  { id: "FLW002", customer: "Meera S.", items: "Mixed Flower Arrangement", total: 680, status: "preparing", date: "Today, 3:30 PM", type: "arrangement" },
  { id: "FLW003", customer: "Raj K.", items: "Birthday Combo (Flowers + Cake)", total: 890, status: "delivered", date: "Yesterday", type: "combo" },
  { id: "FLW004", customer: "Pooja M.", items: "Gift Hamper (Flowers + Chocolates)", total: 1200, status: "shipped", date: "Yesterday", type: "hamper" },
  { id: "FLW005", customer: "Vijay P.", items: "Sympathy Lilies", total: 550, status: "delivered", date: "2 days ago", type: "bouquet" },
];

const mockPartners = [
  { id: "FL001", name: "Floral Studio", orders: 89, rating: 4.8, status: "active" },
  { id: "FL002", name: "Bloom & Blossom", orders: 67, rating: 4.6, status: "active" },
  { id: "FL003", name: "Flower Power", orders: 45, rating: 4.9, status: "active" },
];

const mockCategories = ["Bouquets", "Arrangements", "Combos", "Hampers", "Sympathy", "Corporate"];

interface FlowerItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

const typeColors: Record<string, string> = {
  bouquet: "bg-rose-100 text-rose-700",
  arrangement: "bg-purple-100 text-purple-700",
  combo: "bg-pink-100 text-pink-700",
  hamper: "bg-amber-100 text-amber-700",
};

export default function FlowersAdmin() {
  const [activeTab, setActiveTab] = useState("orders");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FlowerItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Bouquets",
    price: "",
    description: "",
    image_url: "",
    imageFile: null as File | null,
  });

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "items", label: "Items" },
    { id: "partners", label: "Partners" },
    { id: "analytics", label: "Analytics" },
  ];

  useEffect(() => {
    loadFlowerItems();
  }, []);

  const loadFlowerItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("flower_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlowerItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `flower-products/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("flower-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("flower-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewItem({ ...newItem, image_url: url, imageFile: file });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newItem.image_url;
      
      if (newItem.imageFile) {
        const uploaded = await handleImageUpload(newItem.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase.from("flower_items").insert({
        name: newItem.name,
        category: newItem.category,
        price: parseFloat(newItem.price),
        description: newItem.description,
        image_url: imageUrl,
        is_active: true,
      }).select().single();

      if (error) throw error;

      if (data) {
        setFlowerItems([data, ...flowerItems]);
      }
      
      setNewItem({ name: "", category: "Bouquets", price: "", description: "", image_url: "", imageFile: null });
      setShowAddModal(false);
      alert("Item added successfully!");
    } catch (error: any) {
      console.error("Error adding item:", error);
      alert(`Failed to add item: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newItem.image_url;
      
      if (newItem.imageFile) {
        const uploaded = await handleImageUpload(newItem.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase
        .from("flower_items")
        .update({
          name: newItem.name,
          category: newItem.category,
          price: parseFloat(newItem.price),
          description: newItem.description,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem!.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFlowerItems(flowerItems.map(i => i.id === editingItem!.id ? data : i));
      }
      
      resetModal();
      alert("Item updated successfully!");
    } catch (error: any) {
      console.error("Error updating item:", error);
      alert(`Failed to update item: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    
    try {
      const { error } = await supabase.from("flower_items").delete().eq("id", id);
      if (error) throw error;
      
      setFlowerItems(flowerItems.filter(i => i.id !== id));
      alert("Item deleted!");
    } catch (error: any) {
      console.error("Error deleting item:", error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const openEditModal = (item: FlowerItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image_url: item.image_url,
      imageFile: null,
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setNewItem({ name: "", category: "Bouquets", price: "", description: "", image_url: "", imageFile: null });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">423</p>
            <p className="text-green-600 text-sm mt-2">↑ 22% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Custom Arrangements</p>
            <p className="text-3xl font-black text-slate-800 mt-1">67</p>
            <p className="text-green-600 text-sm mt-2">↑ 35% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Revenue</p>
            <p className="text-3xl font-black text-slate-800 mt-1">₹1.8L</p>
            <p className="text-green-600 text-sm mt-2">↑ 18% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Partner Florists</p>
            <p className="text-3xl font-black text-slate-800 mt-1">18</p>
            <p className="text-green-600 text-sm mt-2">↑ 1 new this month</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === tab.id
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Order ID</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Items</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Type</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Total</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Date</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{order.id}</td>
                    <td className="p-4 text-slate-600">{order.customer}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{order.items}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded capitalize ${typeColors[order.type]}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">₹{order.total}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{order.date}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => alert(`Viewing order ${order.id}`)}
                        className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "items" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
              >
                + Add Item
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading items...</div>
            ) : flowerItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No items yet. Add your first item!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {flowerItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-slate-100 relative">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="material-symbols-outlined text-4xl text-slate-300">local_florist</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#ba001c] uppercase">{item.category}</p>
                      <p className="font-bold text-slate-800 mt-1">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xl font-black text-slate-800">₹{item.price}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "partners" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Partner ID</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Name</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Orders</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Rating</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPartners.map((partner) => (
                  <tr key={partner.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{partner.id}</td>
                    <td className="p-4 text-slate-600">{partner.name}</td>
                    <td className="p-4 text-slate-800 font-bold">{partner.orders}</td>
                    <td className="p-4 text-slate-600">{partner.rating}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {partner.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => alert(`Viewing partner ${partner.id}`)}
                        className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300">analytics</span>
            <p className="text-slate-500 mt-4">Analytics coming soon</p>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{editingItem ? "Edit Item" : "Add New Item"}</h3>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Item Image</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#ba001c] transition-colors">
                    {newItem.image_url ? (
                      <div className="relative h-32 w-full">
                        <Image src={newItem.image_url} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, image_url: "", imageFile: null })}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
                        <p className="text-xs text-slate-400 mt-1">Click to upload image</p>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Classic Rose Bouquet"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  >
                    {mockCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="e.g., 12 red roses with lily wrapper"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c] resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => editingItem ? handleSaveEdit() : handleAddItem()}
                  disabled={uploading}
                  className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] disabled:opacity-50"
                >
                  {uploading ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}