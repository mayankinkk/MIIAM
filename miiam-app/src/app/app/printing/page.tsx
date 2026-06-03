"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

export default function PrintingPage() {
import { useCartStore } from "@/lib/store/cartStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";

export default function PrintingPage() {
  const [file, setFile] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sides, setSides] = useState<"single" | "double">("single");
  const [pages, setPages] = useState<number>(1);
  const cartStore = useCartStore();
  const locationStore = useLocationStore();
  const serviceSettings = useServiceSettingsStore();
  
  const isEnabled = serviceSettings.isServiceEnabled("printing");
  const pricePerBW = 2;
  const pricePerColor = 10;
  const totalPrice = pages * (colorMode === "bw" ? pricePerBW : pricePerColor);

  const handleAddToCart = () => {
    if (!file) { alert("Please upload a file"); return; }
    if (!isEnabled) { alert("Printing service is currently unavailable"); return; }
    
    cartStore.addItem({
      id: `print_${Date.now()}`,
      name: `Printing (${colorMode}, ${sides})`,
      price: totalPrice,
      quantity: 1,
      image_url: file,
      vendor_id: "printing_service"
    });
    alert("Added to cart!");
  };

  if (!isEnabled) {
    return (
        <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-6xl text-amber-500">warning</span>
            <h1 className="text-2xl font-black mt-4">Service Unavailable</h1>
            <p className="text-on-surface-variant mt-2">Printing service is currently unavailable in your area or under maintenance.</p>
            <Link href="/app/home" className="mt-6 text-primary font-bold">Go Home</Link>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-background p-6">
      <Link href="/app/home" className="text-primary font-bold mb-6 block">← Back</Link>
      
      <h1 className="text-2xl font-black text-on-surface mb-6">Configure Print</h1>
      
      <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
        <ImageUpload 
          label="Upload PDF or Image"
          onUpload={(url) => setFile(url)}
          currentImage={file}
        />
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-2">Number of Pages</label>
            <input 
              type="number" 
              value={pages} 
              onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-2">Color Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setColorMode("bw")} className={`p-3 rounded-xl border-2 font-bold ${colorMode === "bw" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>B&W (₹{pricePerBW}/pg)</button>
              <button onClick={() => setColorMode("color")} className={`p-3 rounded-xl border-2 font-bold ${colorMode === "color" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>Color (₹{pricePerColor}/pg)</button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-2">Print Sides</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSides("single")} className={`p-3 rounded-xl border-2 font-bold ${sides === "single" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>Single Sided</button>
              <button onClick={() => setSides("double")} className={`p-3 rounded-xl border-2 font-bold ${sides === "double" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>Double Sided</button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
            <span className="text-lg font-bold">Total Price</span>
            <span className="text-2xl font-black text-primary">₹{totalPrice}</span>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={handleAddToCart}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
