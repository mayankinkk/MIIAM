"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionPhone, setPrescriptionPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addToCart = (med: any) => {
    setCart([...cart, med]);
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

      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
          <img src="/images/pharmacy_hero.png" alt="Modern Pharmacy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Trusted Health Care</h2>
            <p className="text-white/90 text-sm">Genuine medicines delivered fast</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4">
        <button
          onClick={() => setShowPrescriptionModal(true)}
          className="w-full bg-white border-2 border-dashed border-[#ba001c] rounded-2xl p-4 flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-[#ba001c]">upload_file</span>
          <span className="font-bold text-[#ba001c]">Upload Prescription</span>
        </button>
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
                    <button onClick={() => addToCart(med)} className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-800">Upload Prescription</h2>
              <button onClick={() => setShowPrescriptionModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {prescriptionFile ? (
                <div>
                  <p className="font-bold text-slate-800">{prescriptionFile.name}</p>
                  <button onClick={() => setPrescriptionFile(null)} className="text-sm text-red-500 mt-2">Remove</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 mx-auto">
                  <span className="material-symbols-outlined text-4xl text-slate-400">add_photo_alternate</span>
                  <span className="text-slate-600">Tap to upload prescription image</span>
                </button>
              )}
            </div>

            <textarea
              placeholder="Add any notes (optional)..."
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-4"
              rows={3}
            />

            <input
              type="tel"
              placeholder="WhatsApp number for updates (e.g., 9876543210)"
              value={prescriptionPhone}
              onChange={(e) => setPrescriptionPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-4"
            />

            <button
              onClick={handlePrescriptionUpload}
              disabled={!prescriptionFile || uploading}
              className="w-full bg-[#ba001c] text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Submit Prescription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}