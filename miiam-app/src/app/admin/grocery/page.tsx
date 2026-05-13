"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const supabase = createClient();

const groceryCategories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Spices", "Pulses", "Oils", "Beverages"];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
}

interface GroceryOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  placed_at: string;
  customer_name?: string;
  customer_phone?: string;
  items?: any[];
}

interface GroceryPartner {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  status: string;
  rating: number;
  cuisine: string;
  total_orders?: number;
}

export default function GroceryAdmin() {
  const [activeTab, setActiveTab] = useState("orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [partners, setPartners] = useState<GroceryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, activePartners: 0, avgDeliveryTime: 0 });
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    stock: "",
    image_url: "",
    imageFile: null as File | null,
  });

  const tabs = [
    { id: "orders", label: "Orders", icon: "receipt_long" },
    { id: "partners", label: "Partners", icon: "store" },
    { id: "products", label: "Inventory", icon: "inventory_2" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
  ];

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadPartners();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
    if (activeTab === "partners") loadPartners();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("total_amount, status, placed_at")
        .eq("vendor_type", "grocery")
        .gte("placed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: partnersData } = await supabase
        .from("vendors")
        .select("id")
        .eq("type", "grocery")
        .eq("status", "active");

      if (ordersData) {
        const totalRevenue = ordersData.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        setStats({
          totalOrders: ordersData.length,
          revenue: totalRevenue,
          activePartners: partnersData?.length || 0,
          avgDeliveryTime: 28,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profile:profiles(full_name, phone),
          order_items(count)
        `)
        .eq("vendor_type", "grocery")
        .order("placed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPartners = async () => {
    setPartnersLoading(true);
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
    } catch (error) {
      console.error("Error loading partners:", error);
    } finally {
      setPartnersLoading(false);
    }
  };

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      loadOrders();
      alert("Order status updated!");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
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

    const { data: urlData } = supabase.storage.from("grocery-images").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Please fill in required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newProduct.image_url;
      
      if (newProduct.imageFile) {
        const uploaded = await handleImageUpload(newProduct.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { error } = await supabase.from("grocery_products").insert({
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 100,
        image_url: imageUrl,
      });

      if (error) throw error;
      loadProducts();
      resetModal();
      alert("Product added!");
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
      if (data) setProducts(products.map(p => p.id === editingProduct!.id ? data : p));
      resetModal();
      alert("Product updated!");
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
      alert("Failed to delete: " + error.message);
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

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    on_the_way: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{stats.totalOrders}</p>
            <p className="text-green-600 text-sm mt-2">↑ 12% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Revenue</p>
            <p className="text-3xl font-black text-slate-800 mt-1">₹{(stats.revenue / 100000).toFixed(1)}L</p>
            <p className="text-green-600 text-sm mt-2">↑ 8% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Active Partners</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{stats.activePartners}</p>
            <p className="text-green-600 text-sm mt-2">↑ 3 new this month</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Avg. Delivery Time</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{stats.avgDeliveryTime} min</p>
            <p className="text-green-600 text-sm mt-2">↓ 5 min improvement</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {ordersLoading ? (
              <div className="p-8 text-center text-slate-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No orders yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Order ID</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Total</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Date</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{order.profile?.full_name || "Customer"}</div>
                        <div className="text-xs text-slate-500">{order.profile?.phone || ""}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{formatCurrency(order.total_amount)}</td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${statusColors[order.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="preparing">Preparing</option>
                          <option value="on_the_way">On the Way</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-500 text-sm">{formatDate(order.placed_at || order.created_at)}</td>
                      <td className="p-4">
                        <button className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PARTNERS TAB */}
        {activeTab === "partners" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex justify-end p-4">
              <button className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]">
                + Add Partner
              </button>
            </div>
            {partnersLoading ? (
              <div className="p-8 text-center text-slate-500">Loading partners...</div>
            ) : partners.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No partners yet. Add your first partner!</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Partner</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Contact</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Orders</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                    <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{partner.shop_name}</div>
                        <div className="text-xs text-slate-500">{partner.owner_name}</div>
                      </td>
                      <td className="p-4 text-slate-600">{partner.phone}</td>
                      <td className="p-4 font-bold text-slate-800">{partner.total_orders || 0}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          partner.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {partner.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
                            Edit
                          </button>
                          <button className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* INVENTORY TAB */}
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
              <div className="p-8 text-center text-slate-500">Loading inventory...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No products yet. Add your first product!</div>
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
                      {product.stock < 10 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Low Stock
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#ba001c] uppercase">{product.category}</p>
                      <p className="font-bold text-slate-800 mt-1">{product.name}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xl font-black text-slate-800">₹{product.price}</p>
                        <span className={`text-xs ${product.stock < 10 ? "text-red-600 font-bold" : "text-slate-400"}`}>
                          Stock: {product.stock}
                        </span>
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

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Order Status Distribution</h3>
              <div className="space-y-3">
                {["delivered", "pending", "cancelled"].map((status) => {
                  const count = orders.filter(o => o.status === status).length;
                  const percent = orders.length ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-600 capitalize">{status}</div>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${status === "delivered" ? "bg-green-500" : status === "pending" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="w-16 text-right text-sm font-bold text-slate-800">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Top Products</h3>
              <div className="space-y-3">
                {products.slice(0, 5).map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <span className="w-6 h-6 bg-[#ba001c] text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <span className="flex-1 text-sm text-slate-800">{product.name}</span>
                    <span className="text-sm font-bold text-slate-500">{product.stock} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                >
                  {groceryCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Price (₹) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Image URL (optional)</label>
                <input
                  type="text"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={editingProduct ? handleSaveEdit : handleAddProduct}
                disabled={uploading}
                className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50"
              >
                {uploading ? "Saving..." : editingProduct ? "Update" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}