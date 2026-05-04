"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const pharmacyCategories = [
  { id: "pain", name: "Pain Relief", icon: "💊", color: "bg-red-100" },
  { id: "fever", name: "Fever & Cold", icon: "🌡️", color: "bg-orange-100" },
  { id: "digestive", name: "Digestive", icon: "💧", color: "bg-green-100" },
  { id: "vitamins", name: "Vitamins", icon: "💊", color: "bg-purple-100" },
  { id: "skincare", name: "Skin Care", icon: "🧴", color: "bg-pink-100" },
  { id: "baby", name: "Baby Care", icon: "👶", color: "bg-blue-100" },
];

interface Medicine {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url: string;
}

export default function PharmacyPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pharmacy_products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching medicines:", error);
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  const filteredMeds = selectedCategory === "all" 
    ? medicines 
    : medicines.filter(m => m.category?.toLowerCase().replace(" ", "") === selectedCategory);

  const addToCart = (med: any) => {
    setCart([...cart, med]);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Pharmacy</h1>
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
          <img src="/images/pharmacy_hero.png" alt="Modern Pharmacy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Trusted Health Care</h2>
            <p className="text-white/90 text-sm">Genuine medicines delivered fast</p>
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
          {pharmacyCategories.map((cat) => (
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

      {/* Medicines Grid */}
      <main className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading medicines...</div>
        ) : filteredMeds.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No medicines found</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMeds.map((med) => (
              <div key={med.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={med.image_url || med.image} alt={med.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c]">₹{med.price}</span>
                    <button 
                      onClick={() => addToCart(med)}
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