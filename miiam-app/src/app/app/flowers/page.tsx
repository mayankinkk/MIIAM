"use client";

import { useState } from "react";
import Link from "next/link";

const flowerCategories = [
  { id: "bouquets", name: "Bouquets", icon: "💐", color: "bg-pink-100" },
  { id: "arrangements", name: "Arrangements", icon: "💐", color: "bg-rose-100" },
  { id: "single", name: "Single Stems", icon: "🌹", color: "bg-red-100" },
  { id: "gifts", name: "Gift Sets", icon: "🎁", color: "bg-purple-100" },
  { id: "ceremony", name: "Ceremony", icon: "💒", color: "bg-amber-100" },
];

const flowers = [
  { name: "Mixed Rose Bouquet", price: 499, category: "Bouquets", desc: "12 red roses with lily", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80" },
  { name: "Pink Rose Surprise", price: 599, category: "Bouquets", desc: "15 pink roses arrangement", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&q=80" },
  { name: "Lily Special", price: 449, category: "Arrangements", desc: "Lilies & carnations", image: "https://images.unsplash.com/photo-1526047932273-341fbfc9f272?w=300&q=80" },
  { name: "Orchid Delight", price: 799, category: "Arrangements", desc: "Exotic orchid vase", image: "https://images.unsplash.com/photo-1563241527-150b0bdbe306?w=300&q=80" },
  { name: "Red Rose (Single)", price: 50, category: "Single Stems", desc: "Premium red rose", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80" },
  { name: "Sunflower (Single)", price: 80, category: "Single Stems", desc: "Bright sunflower", image: "https://images.unsplash.com/photo-1470509037663-253c2d7e6699?w=300&q=80" },
  { name: "Chocolate Combo", price: 699, category: "Gift Sets", desc: "Roses + chocolates", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80" },
  { name: "Teddy & Roses", price: 899, category: "Gift Sets", desc: "Bouquet + teddy bear", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&q=80" },
  { name: "Bridal Bouquet", price: 1499, category: "Ceremony", desc: "Custom wedding bouquet", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80" },
  { name: "Venue Decoration", price: 2999, category: "Ceremony", desc: "Full venue flowers", image: "https://images.unsplash.com/photo-1526047932273-341fbfc9f272?w=300&q=80" },
];

export default function FlowersPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);

  const filteredFlowers = selectedCategory === "all" 
    ? flowers 
    : flowers.filter(f => f.category.toLowerCase().replace(" ", "") === selectedCategory);

  const addToCart = (flower: any) => {
    setCart([...cart, flower]);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Flowers & Gifts</h1>
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
          <img src="/images/flowers_hero.png" alt="Exotic Flowers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Premium Bouquets</h2>
            <p className="text-white/90 text-sm">Exotic arrangements for every occasion</p>
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
          {flowerCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.replace(" ", ""))}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id.replace(" ", "") ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Flowers Grid */}
      <main className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredFlowers.map((flower, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <img src={flower.image} alt={flower.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <p className="font-bold text-slate-800 text-sm">{flower.name}</p>
                <p className="text-xs text-slate-500">{flower.desc}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-black text-[#ba001c]">₹{flower.price}</span>
                  <button 
                    onClick={() => addToCart(flower)}
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