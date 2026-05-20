"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { useToastStore } from "@/lib/store/toastStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

import { useLocationStore } from "@/lib/store/locationStore";

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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionPhone, setPrescriptionPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pharmacySetting, setPharmacySetting] = useState<any>(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItem, items, updateQuantity, totalItems } = useCartStore();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;

  useEffect(() => {
    const setting = useServiceSettingsStore.getState().getSetting("pharmacy");
    setPharmacySetting(setting);
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [userPincode]);

  const fetchMedicines = async () => {
    setLoading(true);
    setIsServiceable(true);

    let query = supabase.from("pharmacy_medicines").select("*").order("created_at", { ascending: false });
    if (userPincode) {
      query = query.eq("pincode", userPincode);
    }
    const { data, error } = await query;
    
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

  const PHARMACY_VENDOR_ID = "00000000-0000-4000-8000-000000000002";

  if (pharmacySetting && !pharmacySetting.isEnabled) {
    return <ServiceUnavailable serviceName="Pharmacy" message={pharmacySetting.message} icon="medication" />;
  }

  const addToCart = (med: any) => {
    if (!isServiceable) {
      addToast("Pharmacy delivery is not available at your location!", "error");
      return;
    }
    addItem({
      id: med.id,
      menu_item_id: med.id,
      name: med.name,
      price: med.price,
      image_url: med.image_url,
      vendor_id: PHARMACY_VENDOR_ID,
      vendor_name: "Pharmacy",
    });
    addToast(`${med.name} added to cart!`, "success");
  };

  const getItemQuantity = (medId: string) => {
    const item = items.find(i => i.menu_item_id === medId);
    return item?.quantity || 0;
  };

  const MedAddButton = ({ med }: { med: any }) => {
    const quantity = getItemQuantity(med.id);
    if (quantity === 0) {
      return (
        <button onClick={() => { addToCart(med); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all animate-glow-pulse">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2 animate-cart-pop">
        <button onClick={() => { updateQuantity(med.id, quantity - 1); if (navigator.vibrate) navigator.vibrate(10); }} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-white font-bold text-sm min-w-[20px] text-center">{quantity}</span>
        <button onClick={() => { addToCart(med); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    );
  };

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) return;
    setUploading(true);

    try {
      const fileExt = prescriptionFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, prescriptionFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("user_prescriptions")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous",
          image_url: urlData.publicUrl,
          notes: prescriptionNotes,
          phone: prescriptionPhone,
          status: "pending"
        });

      if (insertError) throw insertError;

      alert("Prescription uploaded successfully! We'll review and contact you.");
      setShowPrescriptionModal(false);
      setPrescriptionFile(null);
      setPrescriptionNotes("");
      setPrescriptionPhone("");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Pharmacy</h1>
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

      {/* Location / Availability Banner */}
      {!isServiceable && (userPincode || userCity) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl animate-bounce">warning</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">Not serviceable at {userPincode ? `Pincode ${userPincode}` : userCity}</p>
            <p className="text-[10px] text-amber-600 font-medium">Pharmacy delivery is coming soon to your area. You can still browse our catalog!</p>
          </div>
        </div>
      )}
      {isServiceable && (userPincode || userCity) && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
          <p className="text-[11px] font-bold text-green-700">Delivering genuine medicines to {userPincode ? `Pincode ${userPincode}` : userCity}</p>
        </div>
      )}

      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
          <img src="/images/pharmacy_hero.png" alt="Modern Pharmacy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Trusted Health Care</h2>
            <p className="text-white/90 text-sm">Genuine medicines delivered fast</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"} active:scale-95 transition-all`}>
            All
          </button>
          {pharmacyCategories.map((cat, i) => (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"} active:scale-95 transition-all animate-category-slide`} style={{ animationDelay: `${i * 50}ms` }}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading medicines...</div>
        ) : filteredMeds.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No medicines found</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMeds.map((med, index) => (
              <div key={med.id} className="bg-white rounded-2xl overflow-hidden shadow-sm card-lift animate-pop-in" style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}>
                <img src={med.image_url || "/images/pharmacy_hero.png"} alt={med.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c] animate-price-tag">₹{med.price}</span>
                    <MedAddButton med={med} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {totalItems() > 0 && (
        <button
          onClick={() => {
            if (!isServiceable) {
              addToast("Cannot checkout: Pharmacy is not serviceable at your selected location!", "error");
            } else {
              window.location.href = "/app/cart";
            }
          }}
          className={`fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between text-white px-5 py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-transform animate-slide-reveal ${
            isServiceable ? "bg-[#ba001c] shadow-[#ba001c]/40" : "bg-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black text-lg">{isServiceable ? "Checkout" : "Unserviceable"}</span>
        </button>
      )}
    </div>
  );
}