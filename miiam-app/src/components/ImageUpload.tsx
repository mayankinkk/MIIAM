"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

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
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
      if (uploadError) {
        addToast(
          `Upload failed. Make sure the '${bucket}' bucket exists in Supabase Storage with public read access.`,
          "error"
        );
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
        {label}
      </label>
      <div
        className={`relative ${previewHeight} group overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]`}
      >
        {value ? (
          <div className="relative h-full w-full">
            <BlurImage src={value} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-[var(--color-outline-variant)]/60">
            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
            <span className="mt-1 text-xs">Click to upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-container-lowest)]/70">
            <span className="material-symbols-outlined animate-spin text-[var(--color-accent)]">
              progress_activity
            </span>
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
          className="text-xs font-bold text-[var(--color-accent)] hover:underline"
        >
          {useUrl ? "Upload file instead" : "Or enter URL instead"}
        </button>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent ml-auto text-xs hover:underline"
          >
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
          className="mt-2 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
        />
      )}
    </div>
  );
}
