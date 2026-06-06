"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { useToastStore } from "@/lib/store/toastStore";
import { PRINTING_VENDOR_ID, PRINT_MENU_ITEM_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PASSPORT_PRESETS,
  PHOTO_SETS,
  documentTypeLabel,
  getPhotoAspectRatio,
  getPresetById,
  mmToPixels,
  type PassportPreset,
  type PhotoSet,
} from "@/lib/passport-presets";
import PrintHero from "@/components/print/PrintHero";
import CameraCapture from "@/components/print/CameraCapture";

export default function PassportPage() {
  const supabase = createClient();
  const router = useRouter();
  const cartStore = useCartStore();
  const serviceSettings = useServiceSettingsStore();
  const toast = useToastStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [presetId, setPresetId] = useState(PASSPORT_PRESETS[0].id);
  const [setIdx, setSetIdx] = useState(1); // default to 8 (popular)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageNaturalDims, setImageNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [country, setCountry] = useState<string>("all");

  const preset = getPresetById(presetId) || PASSPORT_PRESETS[0];
  const set = PHOTO_SETS[setIdx];
  const aspect = getPhotoAspectRatio(preset);
  const dpi = 300;
  const expectedPxW = mmToPixels(preset.widthMm, dpi);
  const expectedPxH = mmToPixels(preset.heightMm, dpi);

  const isEnabled = serviceSettings.isServiceEnabled("printing");

  const countries = Array.from(new Set(PASSPORT_PRESETS.map((p) => p.country)));
  const filteredPresets = country === "all"
    ? PASSPORT_PRESETS
    : PASSPORT_PRESETS.filter((p) => p.country === country);

  const PASSPORT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const PASSPORT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

  const handleFile = (file: File) => {
    if (!PASSPORT_ALLOWED_TYPES.includes(file.type)) {
      toast.addToast("Only JPG and PNG images are allowed", "error");
      return;
    }
    if (file.size > PASSPORT_MAX_SIZE) {
      toast.addToast(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`, "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);

      const img = new Image();
      img.onload = () => setImageNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const uploadToStorage = async (dataUrl: string): Promise<string | null> => {
    setUploading(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `passports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      if (error) {
        toast.addToast("Upload failed: " + error.message, "error");
        return null;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);
      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isEnabled) { toast.addToast("Printing service is currently unavailable", "error"); return; }
    if (!imageDataUrl) { toast.addToast("Please capture or upload a photo first", "error"); return; }

    const uploadedUrl = await uploadToStorage(imageDataUrl);
    if (!uploadedUrl) return;

    const settings = {
      product: "passport_photo",
      preset: {
        id: preset.id,
        country: preset.country,
        documentType: preset.documentType,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm,
        backgroundColor: preset.backgroundColor,
      },
      count: set.count,
      unitPrice: set.price,
      imageUrl: uploadedUrl,
    };

    cartStore.addItem({
      id: `passport_${Date.now()}`,
      menu_item_id: PRINT_MENU_ITEM_ID,
      vendor_id: PRINTING_VENDOR_ID,
      vendor_name: "MIIAM Print Store",
      name: `Passport photo (${preset.country} ${documentTypeLabel(preset.documentType)} · ${set.count} pcs)`,
      price: set.price,
      image_url: uploadedUrl,
      special_notes: JSON.stringify(settings),
    }, 1);

    toast.addToast("Added to cart", "success");
    router.push("/app/cart");
  };

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-amber-500">warning</span>
        <h1 className="text-2xl font-black mt-4">Service Unavailable</h1>
        <p className="text-on-surface-variant mt-2">Printing service is currently unavailable.</p>
        <Link href="/app/printing" className="mt-6 text-primary font-bold">Back to print</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <PrintHero showBackLink backHref="/app/printing" />

      <div className="p-6 -mt-4 space-y-4 pb-24">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">face</span>
            <h2 className="text-lg font-black text-on-surface">Passport / Visa / ID Photos</h2>
          </div>
          <p className="text-sm text-on-surface-variant">
            Compliant photos delivered in 15 minutes. Pick a preset, capture or upload, and we'll print it on the right paper.
          </p>
        </div>

        {/* Country filter */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <label className="text-xs font-bold text-on-surface-variant block mb-2">Filter by country</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCountry("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
                country === "all" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface"
              }`}
            >
              All
            </button>
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
                  country === c ? "bg-primary text-white" : "bg-surface-container-high text-on-surface"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Preset picker */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <label className="text-xs font-bold text-on-surface-variant block mb-2">
            Choose your document type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {filteredPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  presetId === p.id
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/30 bg-surface-container-high"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface leading-tight">{documentTypeLabel(p.documentType)}</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">{p.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Capture / upload area */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-on-surface-variant">Your photo</label>
            {imageDataUrl && (
              <button
                onClick={() => { setImageDataUrl(null); setImageNaturalDims(null); }}
                className="text-[11px] text-red-500 font-bold"
              >
                Remove
              </button>
            )}
          </div>

          {!imageDataUrl ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowCamera(true)}
                className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Take photo with camera
              </button>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center cursor-pointer hover:border-primary/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">cloud_upload</span>
                <p className="text-sm font-bold text-on-surface">Or upload an image</p>
                <p className="text-[11px] text-on-surface-variant/60 mt-1">JPG, PNG · max 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="bg-surface-container-high rounded-xl p-3 flex items-center justify-center"
                style={{ aspectRatio: aspect, maxHeight: 320 }}
              >
                <img
                  src={imageDataUrl}
                  alt="Your photo preview"
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
              {imageNaturalDims && (
                <div className="text-[11px] text-on-surface-variant space-y-1">
                  <p>
                    Source: {imageNaturalDims.w}×{imageNaturalDims.h}px
                    {Math.abs(imageNaturalDims.w / imageNaturalDims.h - aspect) < 0.05
                      ? <span className="text-emerald-600 font-bold ml-2">✓ Aspect ratio matches</span>
                      : <span className="text-amber-600 font-bold ml-2">Aspect ratio will be cropped</span>}
                  </p>
                  <p>Target: {expectedPxW}×{expectedPxH}px @ {dpi} DPI</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex-1 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                >
                  Retake
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold"
                >
                  Upload another
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </div>
          )}
        </div>

        {/* Set size */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <label className="text-xs font-bold text-on-surface-variant block mb-2">How many copies?</label>
          <div className="grid grid-cols-4 gap-2">
            {PHOTO_SETS.map((s, idx) => (
              <button
                key={s.count}
                onClick={() => setSetIdx(idx)}
                className={`relative p-3 rounded-xl border-2 transition-colors ${
                  setIdx === idx
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/30 bg-surface-container-high"
                }`}
              >
                {s.popular && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <div className="text-2xl font-black text-on-surface">{s.count}</div>
                <div className="text-[10px] text-on-surface-variant">photos</div>
                <div className="text-sm font-bold text-primary mt-1">₹{s.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-on-surface text-sm">
                {preset.emoji} {preset.country} · {documentTypeLabel(preset.documentType)}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {preset.widthMm}×{preset.heightMm}mm · {set.count} copies
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Total</p>
              <p className="text-2xl font-black text-primary">₹{set.price}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!imageDataUrl || uploading}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>Add to Cart · ₹{set.price}</>
          )}
        </button>

        <p className="text-[11px] text-on-surface-variant/60 text-center">
          Photos are printed on premium matte paper. Background fill and color correction included.
        </p>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(dataUrl) => {
            setImageDataUrl(dataUrl);
            const img = new Image();
            img.onload = () => setImageNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = dataUrl;
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          aspect={aspect}
        />
      )}
    </div>
  );
}
