"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

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
  const { getSetting } = useServiceSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionPhone, setPrescriptionPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItem, totalItems } = useCartStore();
  const pharmacySetting = getSetting("pharmacy");

  if (pharmacySetting && !pharmacySetting.isEnabled) {
    return <ServiceUnavailable serviceName="Pharmacy" message={pharmacySetting.message} icon="medication" />;
  }

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pharmacy_medicines")
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

  const PHARMACY_VENDOR_ID = "00000000-0000-4000-8000-000000000002";

  const addToCart = (med: any) => {
    addItem({
      id: med.id,
      menu_item_id: med.id,
      name: med.name,
      price: med.price,
      image_url: med.image_url,
      vendor_id: PHARMACY_VENDOR_ID,
      vendor_name: "Pharmacy",
    });
  };

  const getItemQuantity = (medId: string) => {
    const item = items.find(i => i.menu_item_id === medId);
    return item?.quantity || 0;
  };

  const MedAddButton = ({ med }: { med: any }) => {
    const quantity = getItemQuantity(med.id);
    if (quantity === 0) {
      return (
        <button onClick={() => addToCart(med)} className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2">
        <button onClick={() => updateQuantity(med.id, quantity - 1)} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-white font-bold text-sm min-w-[20px] text-center">{quantity}</span>
        <button onClick={() => addToCart(med)} className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 transition-transform">
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
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
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
          <button onClick={() => setSelectedCategory("all")} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}>
            All
          </button>
          {pharmacyCategories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}>
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
            {filteredMeds.map((med) => (
              <div key={med.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={med.image_url || "/images/pharmacy_hero.png"} alt={med.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c]">₹{med.price}</span>
                    <MedAddButton med={med} />
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