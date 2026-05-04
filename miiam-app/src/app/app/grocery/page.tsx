"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
}

const groceryCategories = [
  { id: "fruits", name: "Fruits", icon: "🍎", color: "bg-red-100" },
  { id: "vegetables", name: "Vegetables", icon: "🥬", color: "bg-green-100" },
  { id: "dairy", name: "Dairy", icon: "🥛", color: "bg-blue-100" },
  { id: "bakery", name: "Bakery", icon: "🍞", color: "bg-amber-100" },
  { id: "spices", name: "Spices", icon: "🌶️", color: "bg-orange-100" },
  { id: "pulses", name: "Pulses", icon: "🫘", color: "bg-brown-100" },
  { id: "oils", name: "Oils", icon: "🫗", color: "bg-yellow-100" },
  { id: "beverages", name: "Beverages", icon: "🧃", color: "bg-purple-100" },
];

export default function GroceryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grocery_products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === selectedCategory);

  const addToCart = (product: any) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Grocery</h1>
          <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba001c] text-white text-xs rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
          <img src="/images/grocery_hero.png" alt="Premium Grocery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Fresh Organic Selection</h2>
            <p className="text-white/90 text-sm">Handpicked quality for you</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            All
          </button>
          {groceryCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No products found</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={product.image_url || product.image} alt={product.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c]">₹{product.price}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}