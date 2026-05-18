"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { useToastStore } from "@/lib/store/toastStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [grocerySetting, setGrocerySetting] = useState<any>(null);
  const { items, addItem, updateQuantity, totalItems } = useCartStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const setting = useServiceSettingsStore.getState().getSetting("grocery");
    setGrocerySetting(setting);
  }, []);

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

  const GROCERY_VENDOR_ID = "00000000-0000-4000-8000-000000000003";

  if (grocerySetting && !grocerySetting.isEnabled) {
    return <ServiceUnavailable serviceName="Grocery" message={grocerySetting.message} icon="shopping_cart" />;
  }

  const addToCart = (product: any) => {
    addItem({
      id: product.id,
      menu_item_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      vendor_id: GROCERY_VENDOR_ID,
      vendor_name: "Grocery",
    });
    addToast(`${product.name} added to cart!`, "success");
  };

  const getItemQuantity = (productId: string) => {
    const item = (items || []).find(i => i.menu_item_id === productId);
    return item?.quantity || 0;
  };

  const ProductAddButton = ({ product }: { product: any }) => {
    const quantity = getItemQuantity(product.id);
    if (quantity === 0) {
      return (
        <button onClick={() => { addToCart(product); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all animate-glow-pulse">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2 animate-cart-pop">
        <button onClick={() => { updateQuantity(product.id, quantity - 1); if (navigator.vibrate) navigator.vibrate(10); }} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-white font-bold text-sm min-w-[20px] text-center">{quantity}</span>
        <button onClick={() => { addToCart(product); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    );
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
          <Link href="/app/cart" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalItems() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba001c] text-white text-xs rounded-full flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </Link>
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
            onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
            } active:scale-95 transition-all`}
          >
            All
          </button>
          {groceryCategories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              } active:scale-95 transition-all animate-category-slide`}
              style={{ animationDelay: `${i * 50}ms` }}
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
            {filteredProducts.map((product: any, index) => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm card-lift animate-pop-in" style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}>
                <img src={product.image_url || product.image} alt={product.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c] animate-price-tag">₹{product.price}</span>
                    <ProductAddButton product={product} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {totalItems() > 0 && (
        <Link
          href="/app/cart"
          className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between bg-[#ba001c] text-white px-5 py-4 rounded-2xl shadow-2xl shadow-[#ba001c]/40 active:scale-[0.98] transition-transform animate-slide-reveal"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black text-lg">Checkout</span>
        </Link>
      )}
    </div>
  );
}