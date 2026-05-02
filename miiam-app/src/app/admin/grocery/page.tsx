"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const supabase = createClient();

const mockOrders = [
  { id: "ORD001", customer: "John D.", items: "Fresh Apples (2kg), Bananas (1 dozen)", total: 340, status: "delivered", date: "Today, 10:30 AM" },
  { id: "ORD002", customer: "Sarah M.", items: "Milk, Eggs, Bread", total: 180, status: "preparing", date: "Today, 11:15 AM" },
  { id: "ORD003", customer: "Mike R.", items: "Vegetables Bundle", total: 220, status: "delivered", date: "Yesterday" },
  { id: "ORD004", customer: "Emma L.", items: "Rice, Dal, Oil", total: 450, status: "delivered", date: "Yesterday" },
  { id: "ORD005", customer: "Alex P.", items: "Spices Mix", total: 150, status: "cancelled", date: "2 days ago" },
];

const mockPartners = [
  { id: "P001", name: "Fresh Mart", orders: 245, rating: 4.5, status: "active" },
  { id: "P002", name: "Grocery Hub", orders: 189, rating: 4.2, status: "active" },
  { id: "P003", name: "Quick Grocery", orders: 156, rating: 4.8, status: "active" },
];

const mockCategories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Spices", "Pulses", "Oils", "Beverages"];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function GroceryAdmin() {
  const [activeTab, setActiveTab] = useState("orders");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    stock: "",
    image_url: "",
    imageFile: null as File | null,
  });

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "partners", label: "Partners" },
    { id: "products", label: "Products" },
    { id: "analytics", label: "Analytics" },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("grocery_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `grocery-products/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("grocery-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("grocery-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewProduct({ ...newProduct, image_url: url, imageFile: file });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newProduct.image_url;
      
      if (newProduct.imageFile) {
        const uploaded = await handleImageUpload(newProduct.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase.from("grocery_products").insert({
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        image_url: imageUrl,
        is_active: true,
      }).select().single();

      if (error) throw error;

      if (data) {
        setProducts([data, ...products]);
      }
      
      setNewProduct({ name: "", category: "Fruits", price: "", stock: "", image_url: "", imageFile: null });
      setShowAddModal(false);
      alert("Product added successfully!");
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert(`Failed to add product: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newProduct.image_url;
      
      if (newProduct.imageFile) {
        const uploaded = await handleImageUpload(newProduct.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase
        .from("grocery_products")
        .update({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 0,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct!.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProducts(products.map(p => p.id === editingProduct!.id ? data : p));
      }
      
      resetModal();
      alert("Product updated successfully!");
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert(`Failed to update product: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    
    try {
      const { error } = await supabase.from("grocery_products").delete().eq("id", id);
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
      alert("Product deleted!");
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url,
      imageFile: null,
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({ name: "", category: "Fruits", price: "", stock: "", image_url: "", imageFile: null });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">1,247</p>
            <p className="text-green-600 text-sm mt-2">↑ 12% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Revenue</p>
            <p className="text-3xl font-black text-slate-800 mt-1">₹4.2L</p>
            <p className="text-green-600 text-sm mt-2">↑ 8% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Active Partners</p>
            <p className="text-3xl font-black text-slate-800 mt-1">45</p>
            <p className="text-green-600 text-sm mt-2">↑ 3 new this month</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Avg. Delivery Time</p>
            <p className="text-3xl font-black text-slate-800 mt-1">28 min</p>
            <p className="text-green-600 text-sm mt-2">↓ 5 min improvement</p>
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

        {activeTab === "products" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
              >
                + Add Product
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No products yet. Add your first product!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-slate-100 relative">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="material-symbols-outlined text-4xl text-slate-300">shopping_bag</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#ba001c] uppercase">{product.category}</p>
                      <p className="font-bold text-slate-800 mt-1">{product.name}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xl font-black text-slate-800">₹{product.price}</p>
                        <span className="text-xs text-slate-400">Stock: {product.stock}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
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
                <h3 className="font-bold text-lg">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Product Image</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#ba001c] transition-colors">
                    {newProduct.image_url ? (
                      <div className="relative h-32 w-full">
                        <Image src={newProduct.image_url} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, image_url: "", imageFile: null })}
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
                  <label className="block text-sm font-bold text-slate-600 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Organic Apples"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  >
                    {mockCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Stock</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => editingProduct ? handleSaveEdit() : handleAddProduct()}
                  disabled={uploading}
                  className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] disabled:opacity-50"
                >
                  {uploading ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}