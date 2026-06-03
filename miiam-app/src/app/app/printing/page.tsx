"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { useCartStore } from "@/lib/store/cartStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";

const STEPS = ["Upload", "Customize", "Checkout"] as const;

export default function PrintingPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<string>("");
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
      menu_item_id: `print_${Date.now()}`,
      vendor_id: "printing_service",
      vendor_name: "MIIAM Printing",
      name: `Printing (${colorMode}, ${sides})`,
      price: totalPrice,
      image_url: file,
    }, 1);
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
      <Link href="/app/home" className="text-primary font-bold mb-4 block">← Back</Link>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const isActive = step === idx;
          const isDone = step > idx;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isActive ? "bg-primary text-white shadow-lg shadow-primary/25" :
                isDone ? "bg-green-100 text-green-700" :
                "bg-surface-container-high text-on-surface-variant"
              }`}>
                <span className="material-symbols-outlined text-base">
                  {isDone ? "check_circle" : isActive ? "radio_button_checked" : "radio_button_unchecked"}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${isDone ? "bg-green-400" : "bg-outline-variant/30"}`} />
              )}
            </div>
          );
        })}
      </div>
      
      <h1 className="text-2xl font-black text-on-surface mb-6">Print Store</h1>
      
      {step === 1 && (
        <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
          <ImageUpload 
            label="Upload PDF or Image"
            onChange={(url) => setFile(url)}
            value={file}
          />
          {file && (
            <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              File uploaded successfully
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={!file}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Continue to Customize →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
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

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold">Review Order →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-4">
          <h3 className="font-bold text-lg">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-on-surface-variant">Pages</span><span className="font-bold">{pages}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Color</span><span className="font-bold capitalize">{colorMode === "bw" ? "Black & White" : "Color"}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Sides</span><span className="font-bold capitalize">{sides} sided</span></div>
            <div className="pt-2 border-t border-outline-variant/10 flex justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-black text-primary">₹{totalPrice}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Back</button>
            <button onClick={handleAddToCart} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold">Add to Cart</button>
          </div>
        </div>
      )}
    </div>
  );
}
