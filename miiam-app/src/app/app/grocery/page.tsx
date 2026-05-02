"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

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

const sampleProducts = [
  { name: "Fresh Apples (1kg)", price: 120, category: "Fruits", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cda4?w=300&q=80" },
  { name: "Bananas (1 dozen)", price: 50, category: "Fruits", image: "https://images.unsplash.com/photo-1571771894821-ce7b6fa8d0a3?w=300&q=80" },
  { name: "Organic Spinach (250g)", price: 45, category: "Vegetables", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80" },
  { name: "Fresh Tomatoes (1kg)", price: 40, category: "Vegetables", image: "https://images.unsplash.com/photo-1546470427-227c7b7852ae?w=300&q=80" },
  { name: "Fresh Milk (1L)", price: 60, category: "Dairy", image: "https://images.unsplash.com/photo-1550583724-b0c0f5a248e8?w=300&q=80" },
  { name: "Curd (500g)", price: 40, category: "Dairy", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80" },
  { name: "Whole Wheat Bread", price: 50, category: "Bakery", image: "https://images.unsplash.com/photo-1509440150476-9e23bf381aec?w=300&q=80" },
  { name: "Butter Croissants", price: 80, category: "Bakery", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80" },
  { name: "Turmeric Powder (100g)", price: 45, category: "Spices", image: "https://images.unsplash.com/photo-1615485290382-441e4d1cb3b0?w=300&q=80" },
  { name: "Red Chilli (100g)", price: 35, category: "Spices", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80" },
  { name: "Moong Dal (1kg)", price: 120, category: "Pulses", image: "https://images.unsplash.com/photo-1518110925490-1d993eb6f545?w=300&q=80" },
  { name: "Toor Dal (1kg)", price: 140, category: "Pulses", image: "https://images.unsplash.com/photo-1603360946369-dc2224db43f2?w=300&q=80" },
  { name: "Mustard Oil (1L)", price: 180, category: "Oils", image: "https://images.unsplash.com/photo-1589984664556-8955d98d2221?w=300&q=80" },
  { name: "Refined Oil (1L)", price: 160, category: "Oils", image: "https://images.unsplash.com/photo-1474979266404-7eaac9910cb1?w=300&q=80" },
  { name: "Mango Juice (1L)", price: 80, category: "Beverages", image: "https://images.unsplash.com/photo-1625777963668-d2432e82c516?w=300&q=80" },
  { name: "Orange Squash (750ml)", price: 120, category: "Beverages", image: "https://images.unsplash.com/photo-1621504450180-0796a38a74ca?w=300&q=80" },
];

export default function GroceryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);

  const filteredProducts = selectedCategory === "all" 
    ? sampleProducts 
    : sampleProducts.filter(p => p.category.toLowerCase() === selectedCategory);

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
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
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
      </main>
    </div>
  );
}