"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

export default function PrintingPage() {
  const [file, setFile] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sides, setSides] = useState<"single" | "double">("single");

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
            <label className="text-sm font-bold text-on-surface-variant block mb-2">Color Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setColorMode("bw")} className={`p-3 rounded-xl border-2 font-bold ${colorMode === "bw" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>B&W</button>
              <button onClick={() => setColorMode("color")} className={`p-3 rounded-xl border-2 font-bold ${colorMode === "color" ? "border-primary bg-primary/10" : "border-outline-variant"}`}>Color</button>
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
      </div>

      <div className="mt-8">
        <Link 
          href="/app/home" 
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors block text-center"
        >
          Add to Cart →
        </Link>
      </div>
    </div>
  );
}
