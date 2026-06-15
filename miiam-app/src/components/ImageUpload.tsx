"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  label?: string;
  previewHeight?: string;
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  bucket = "menu-images",
  folder = "uploads",
  label = "Image",
  previewHeight = "h-40",
  accept = "image/*",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const [useUrl, setUseUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);
      if (uploadError) {
        addToast(`Upload failed. Make sure the '${bucket}' bucket exists in Supabase Storage with public read access.`, "error");
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      onChange(publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1 block">{label}</label>
      <div className={`relative ${previewHeight} bg-[var(--color-surface-subtle)] rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] overflow-hidden group`}>
        {value ? (
          <div className="relative w-full h-full">
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 w-11 h-11 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-outline-variant)]/60">
            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
            <span className="text-xs mt-1">Click to upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-[var(--color-surface-container-lowest)]/70 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ba001c] animate-spin">progress_activity</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setUseUrl(!useUrl);
            if (!useUrl) onChange("");
          }}
          className="text-xs font-bold text-[#ba001c] hover:underline"
        >
          {useUrl ? "Upload file instead" : "Or enter URL instead"}
        </button>
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-auto">
            View
          </a>
        )}
      </div>
      {useUrl && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-2 w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
        />
      )}
    </div>
  );
}
