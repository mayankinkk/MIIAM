"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

export default function PrintingPage() {
  const [file, setFile] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-on-background p-6">
      <Link href="/app/home" className="text-primary font-bold mb-6 block">← Back</Link>
      
      <h1 className="text-2xl font-black text-on-surface mb-6">Upload Documents</h1>
      
      <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10">
        <ImageUpload 
          label="Upload PDF or Image"
          onUpload={(url) => setFile(url)}
          currentImage={file}
        />
        {file && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
            File uploaded successfully!
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link 
          href="/app/home" 
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors block text-center"
        >
          Continue to Settings →
        </Link>
      </div>
    </div>
  );
}
