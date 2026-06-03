"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

const STEPS = ["Upload", "Customize", "Checkout"] as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function PrintingPage() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sides, setSides] = useState<"single" | "double">("single");
  const [pages, setPages] = useState<number>(1);
  const [copies, setCopies] = useState<number>(1);
  const [paperSize, setPaperSize] = useState<"a4" | "a3">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [paperType, setPaperType] = useState<"standard" | "glossy">("standard");
  const cartStore = useCartStore();
  const locationStore = useLocationStore();
  const serviceSettings = useServiceSettingsStore();
  
  const isEnabled = serviceSettings.isServiceEnabled("printing");

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `prints/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(fileName, file);
    if (uploadError) {
      alert("Upload failed. Make sure the 'menu-images' bucket exists.");
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleFilesSelected = async (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(f => {
      if (!ALLOWED_TYPES.includes(f.type)) { alert(`${f.name} is not supported. Please upload PDF or images.`); return false; }
      if (f.size > MAX_FILE_SIZE) { alert(`${f.name} exceeds 10MB limit.`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;

    setUploading(true);
    for (const f of validFiles) {
      const url = await uploadFile(f);
      if (url) {
        setFiles(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, name: f.name, url, type: f.type, size: f.size }]);
      }
    }
    setUploading(false);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const pricePerBW = 2;
  const pricePerColor = 10;
  const glossySurcharge = paperType === "glossy" ? 5 : 0;
  const a3Surcharge = paperSize === "a3" ? 3 : 0;
  const perPagePrice = (colorMode === "bw" ? pricePerBW : pricePerColor) + glossySurcharge + a3Surcharge;
  const subtotal = perPagePrice * pages;
  const totalPrice = subtotal * copies;

  const handleAddToCart = () => {
    if (files.length === 0) { alert("Please upload at least one file"); return; }
    if (!isEnabled) { alert("Printing service is currently unavailable"); return; }
    
    cartStore.addItem({
      id: `print_${Date.now()}`,
      menu_item_id: `print_${Date.now()}`,
      vendor_id: "printing_service",
      vendor_name: "MIIAM Printing",
      name: `Printing (${colorMode}, ${sides})`,
      price: totalPrice,
      image_url: files[0].url,
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
    <div className="min-h-screen bg-background text-on-background">
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-8 pb-10">
        <Link href="/app/home" className="text-white/80 font-bold mb-4 block hover:text-white">← Back</Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl">print</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Print Store</h1>
            <p className="text-white/70 text-sm">Upload. Print. Delivered in minutes.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">bolt</span>
            Delivered in minutes
          </span>
          <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">schedule</span>
            6 AM - 12 AM
          </span>
        </div>
      </div>

      <div className="p-6 -mt-4">
        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 bg-surface-container rounded-2xl p-3 shadow-sm border border-outline-variant/10">
          {STEPS.map((label, i) => {
            const idx = i + 1;
            const isActive = step === idx;
            const isDone = step > idx;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/25" :
                  isDone ? "bg-green-100 text-green-700" :
                  "text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {isDone ? "check_circle" : isActive ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${isDone ? "bg-green-400" : "bg-outline-variant/30"}`} />
                )}
              </div>
            );
          })}
        </div>
        
        {step === 1 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
            {/* Privacy Banner */}
            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
              <span className="material-symbols-outlined text-indigo-600 text-sm">lock</span>
              <p className="text-xs text-indigo-700">Your documents are safe & secure. Files are automatically deleted after printing.</p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesSelected(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-outline-variant hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                disabled={uploading}
                onChange={(e) => { if (e.target.files) handleFilesSelected(e.target.files); e.target.value = ""; }}
              />
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-indigo-600">cloud_upload</span>
              </div>
              <p className="font-bold text-on-surface mb-1">Upload your files</p>
              <p className="text-sm text-on-surface-variant">Drag & drop or click to browse</p>
              <p className="text-xs text-on-surface-variant/60 mt-2">PDF, JPG, PNG (max 10MB each)</p>
            </div>

            {uploading && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-high rounded-xl">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-on-surface-variant">Uploading files...</span>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-on-surface-variant">{files.length} file{files.length > 1 ? "s" : ""} uploaded</p>
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {f.type === "application/pdf" ? (
                        <span className="material-symbols-outlined text-indigo-600 text-lg">description</span>
                      ) : (
                        <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{f.name}</p>
                      <p className="text-xs text-on-surface-variant/60">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100">
                      <span className="material-symbols-outlined text-red-500 text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={files.length === 0}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Continue to Customize →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-on-surface-variant block mb-2">Number of Pages</label>
                  <input type="number" value={pages} onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant text-center" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-on-surface-variant block mb-2">Copies</label>
                  <input type="number" value={copies} onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant text-center" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">Color Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setColorMode("bw")} className={`p-3 rounded-xl border-2 font-bold text-sm ${colorMode === "bw" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>B&W · ₹{pricePerBW}<span className="text-xs">/pg</span></button>
                  <button onClick={() => setColorMode("color")} className={`p-3 rounded-xl border-2 font-bold text-sm ${colorMode === "color" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Color · ₹{pricePerColor}<span className="text-xs">/pg</span></button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">Print Sides</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSides("single")} className={`p-3 rounded-xl border-2 font-bold text-sm ${sides === "single" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Single Sided</button>
                  <button onClick={() => setSides("double")} className={`p-3 rounded-xl border-2 font-bold text-sm ${sides === "double" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Double Sided</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">Paper Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaperSize("a4")} className={`p-3 rounded-xl border-2 font-bold text-sm ${paperSize === "a4" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>A4</button>
                  <button onClick={() => setPaperSize("a3")} className={`p-3 rounded-xl border-2 font-bold text-sm ${paperSize === "a3" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>A3 (+₹{a3Surcharge}/pg)</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOrientation("portrait")} className={`p-3 rounded-xl border-2 font-bold text-sm ${orientation === "portrait" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Portrait</button>
                  <button onClick={() => setOrientation("landscape")} className={`p-3 rounded-xl border-2 font-bold text-sm ${orientation === "landscape" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Landscape</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-2">Paper Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaperType("standard")} className={`p-3 rounded-xl border-2 font-bold text-sm ${paperType === "standard" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Standard</button>
                  <button onClick={() => setPaperType("glossy")} className={`p-3 rounded-xl border-2 font-bold text-sm ${paperType === "glossy" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface"}`}>Glossy (+₹{glossySurcharge}/pg)</button>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-4 border-t border-outline-variant/10 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Per page</span><span className="font-bold">₹{perPagePrice}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Pages × {pages}</span><span className="font-bold">₹{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Copies × {copies}</span><span className="font-bold">₹{totalPrice}</span></div>
              <div className="pt-2 border-t border-outline-variant/10 flex justify-between text-base">
                <span className="font-bold">Total</span>
                <span className="text-xl font-black text-primary">₹{totalPrice}</span>
              </div>
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
              <div className="flex justify-between"><span className="text-on-surface-variant">Files</span><span className="font-bold">{files.length}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Pages</span><span className="font-bold">{pages}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Copies</span><span className="font-bold">{copies}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Color</span><span className="font-bold capitalize">{colorMode === "bw" ? "Black & White" : "Color"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Sides</span><span className="font-bold capitalize">{sides} sided</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Paper</span><span className="font-bold uppercase">{paperSize} · {paperType === "glossy" ? "Glossy" : "Standard"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Orientation</span><span className="font-bold capitalize">{orientation}</span></div>
              <div className="pt-3 border-t border-outline-variant/10 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">₹{perPagePrice}/pg × {pages} pg × {copies} copies</span><span className="font-bold">₹{totalPrice}</span></div>
                <div className="flex justify-between text-lg pt-1">
                  <span className="font-black">Total</span>
                  <span className="text-2xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Back</button>
              <button onClick={handleAddToCart} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold">Add to Cart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
