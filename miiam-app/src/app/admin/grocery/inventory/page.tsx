"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";

const supabase = createClient();

const groceryCategories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Spices", "Pulses", "Oils", "Beverages"];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  vendor_id?: string;
  created_at: string;
}

export default function GroceryInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [vendors, setVendors] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    stock: "",
    image_url: "",
    vendor_id: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: vendorsData, error: vendorError } = await supabase.from("vendors").select("id, shop_name").eq("type", "grocery");
      if (vendorError) console.error("Vendor fetch error:", vendorError);
      if (vendorsData) setVendors(vendorsData);

      const { data, error } = await supabase
        .from("grocery_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);

      const lowStock = data?.filter((p: Product) => p.stock > 0 && p.stock < 10).length || 0;
      const outOfStock = data?.filter((p: Product) => p.stock === 0).length || 0;
      const totalValue = data?.reduce((sum: number, p: Product) => sum + (p.price * p.stock), 0) || 0;

      setStats({
        total: data?.length || 0,
        lowStock,
        outOfStock,
        totalValue,
      });
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.vendor_id) {
      alert("Please fill in required fields (Name, Price, Vendor)");
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("grocery_products")
          .update({
            name: newProduct.name,
            category: newProduct.category,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock) || 0,
            image_url: newProduct.image_url || null,
            vendor_id: newProduct.vendor_id,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("grocery_products").insert({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 100,
          image_url: newProduct.image_url || null,
          vendor_id: newProduct.vendor_id,
        });

        if (error) throw error;
      }

      resetModal();
      loadProducts();
      alert(editingProduct ? "Product updated!" : "Product added!");
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
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

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from("grocery_products")
        .update({ stock: newStock })
        .eq("id", productId);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock");
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
      vendor_id: product.vendor_id || "",
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({ name: "", category: "Fruits", price: "", stock: "", image_url: "", vendor_id: "" });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === "" ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesVendor = vendorFilter === "all" || product.vendor_id === vendorFilter;

    return matchesSearch && matchesCategory && matchesVendor;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/grocery" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Grocery Inventory</h1>
          <p className="text-slate-500 text-sm">Manage grocery products and stock</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
        >
          + Add Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL PRODUCTS</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">LOW STOCK</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.lowStock}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">OUT OF STOCK</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.outOfStock}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-xs font-bold">INVENTORY VALUE</p>
          <p className="text-2xl font-black text-blue-700 mt-1">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Categories</option>
          {groceryCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Vendors</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">inventory_2</span>
          <p className="mt-4 font-bold">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-slate-100 relative">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-4xl text-slate-300">shopping_bag</span>
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
                {product.stock > 0 && product.stock < 10 && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Low Stock
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-bold text-[#ba001c] uppercase">{product.category}</p>
                <p className="text-xs text-slate-500 mb-1">{vendors.find(v => v.id === product.vendor_id)?.shop_name || "Unknown Vendor"}</p>
                <p className="font-bold text-slate-800">{product.name}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xl font-black text-slate-800">₹{product.price}</p>
                  <span className={`text-xs ${product.stock === 0 ? "text-red-600 font-bold" : product.stock < 10 ? "text-yellow-600 font-bold" : "text-slate-400"}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateProductStock(product.id, Math.max(0, product.stock - 1))}
                    className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-slate-800">{product.stock}</span>
                  <button
                    onClick={() => updateProductStock(product.id, product.stock + 1)}
                    className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200"
                  >
                    +
                  </button>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
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
                <label className="text-xs font-bold text-slate-600 mb-1 block">Vendor *</label>
                <select
                  value={newProduct.vendor_id}
                  onChange={(e) => setNewProduct({ ...newProduct, vendor_id: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none"
                >
                  {groceryCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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
              <ImageUpload
                value={newProduct.image_url}
                onChange={(url) => setNewProduct({ ...newProduct, image_url: url })}
                bucket="grocery-images"
                folder="grocery-products"
                label="Product Image"
                previewHeight="h-32"
              />
            </div>

            <div className="p-6 border-t flex gap-4">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50"
              >
                {saving ? "Saving..." : editingProduct ? "Update" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}