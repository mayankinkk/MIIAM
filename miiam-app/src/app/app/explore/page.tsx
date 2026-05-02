"use client";

import { useState } from "react";
import Link from "next/link";

const features = [
  { id: "food", icon: "restaurant", label: "Food Delivery", desc: "Order from top restaurants", color: "bg-orange-100 text-orange-600" },
  { id: "grocery", icon: "shopping_basket", label: "Grocery", desc: "Fresh groceries delivered", color: "bg-green-100 text-green-600" },
  { id: "beauty", icon: "spa", label: "Beauty & Wellness", desc: "Salon, Spa, Nails", color: "bg-pink-100 text-pink-600" },
  { id: "services", icon: "home_repair_service", label: "Home Services", desc: "AC, Plumbing, Cleaning", color: "bg-blue-100 text-blue-600" },
  { id: "pharmacy", icon: "medication", label: "Pharmacy", desc: "Medicines at your door", color: "bg-purple-100 text-purple-600" },
  { id: "flowers", icon: "local_florist", label: "Flowers & Gifts", desc: "Send love & wishes", color: "bg-rose-100 text-rose-600" },
];



const collections = [
  { id: "c1", name: "Budget Friendly", emoji: "💰", count: 45, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80" },
  { id: "c2", name: "Popular Picks", emoji: "🔥", count: 32, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80" },
  { id: "c3", name: "Healthy Eats", emoji: "🥗", count: 28, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80" },
  { id: "c4", name: "Late Night Cravings", emoji: "🌙", count: 21, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80" },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-8 pb-4">
        <h1 className="text-3xl font-black text-[#4d212a] mb-2">Explore</h1>
        <p className="text-slate-500 mb-6">Discover everything MIIAM has to offer</p>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for anything..."
            className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
          />
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Services Grid */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">All Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link 
                key={feature.id} 
                href={`/app/${feature.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-slate-800">{feature.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">Featured Collections</h2>
          <div className="grid grid-cols-2 gap-4">
            {collections.map((collection) => (
              <div 
                key={collection.id}
                className="relative rounded-2xl overflow-hidden h-40 group"
              >
                <img 
                  src={collection.image} 
                  alt={collection.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xl mb-1">{collection.emoji}</p>
                  <h3 className="font-black text-white text-lg">{collection.name}</h3>
                  <p className="text-xs text-white/70">{collection.count} places</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Become a Partner CTA */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">store</span>
            </div>
            <div>
              <h3 className="font-black text-xl">Partner with MIIAM</h3>
              <p className="text-sm text-white/70">Grow your business with us</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-4">Join 10,000+ restaurants and service providers earning with MIIAM.</p>
          <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
            Register Your Business
          </button>
        </div>

        {/* Download App CTA */}
        <div className="bg-[#ba001c] rounded-2xl p-6 text-white text-center">
          <h3 className="font-black text-2xl mb-2">Download MIIAM App</h3>
          <p className="text-sm text-white/80 mb-4">Get exclusive deals and faster ordering</p>
          <div className="flex gap-3 justify-center">
            <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🍎</span>
              <span className="font-bold text-sm">App Store</span>
            </button>
            <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🤖</span>
              <span className="font-bold text-sm">Play Store</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}