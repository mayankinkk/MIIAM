"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { usePrintLibraryStore } from "@/lib/store/printLibraryStore";
import { useToastStore } from "@/lib/store/toastStore";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { getPrintingPricing } from "@/lib/printing-pricing";
import { useTranslation } from "@/lib/i18n/useTranslation";
import PrintHero from "@/components/print/PrintHero";
import PrintFirstOrderCoupon from "@/components/print/PrintFirstOrderCoupon";
import WhyPrintWithMiiam from "@/components/print/WhyPrintWithMiiam";
import PrintTestimonials from "@/components/print/PrintTestimonials";
import FilePreviewModal, { type PreviewFile } from "@/components/print/FilePreviewModal";
import {
  PRINT_ALLOWED_TYPES,
  PRINT_MAX_FILE_SIZE,
  PRINT_MAX_FILE_COUNT,
  bytesToHumanReadable,
  extractPdfPageCountFromText,
  getPdfPageCount,
  isPdfEncrypted,
  parsePrintRange,
  readPdfFirstBytes,
  summarizeRange,
  validatePdfFile,
} from "@/lib/printing-utils";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  pageCount: number;
  blob?: File;
  saveToLibrary: boolean;
}

const STEPS = ["Upload", "Customize", "Checkout"] as const;

export default function PrintingPage() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sides, setSides] = useState<"single" | "double">("single");
  const [pagesInput, setPagesInput] = useState<number>(1);
  const [copies, setCopies] = useState<number>(1);
  const [paperSize, setPaperSize] = useState<"a4" | "a3">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [paperType, setPaperType] = useState<"standard" | "glossy">("standard");
  const [printRange, setPrintRange] = useState<string>("");
  const [parsedRange, setParsedRange] = useState<number[]>([]);
  const router = useRouter();
  const cartStore = useCartStore();
  const locationStore = useLocationStore();
  const serviceSettings = useServiceSettingsStore();
  const library = usePrintLibraryStore();
  const toast = useToastStore();
  const { t } = useTranslation();

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
    const remainingSlots = PRINT_MAX_FILE_COUNT - files.length;
    if (remainingSlots <= 0) {
      alert(t.print.fileLimitReached.replace("{max}", String(PRINT_MAX_FILE_COUNT)));
      return;
    }

    const candidates = Array.from(newFiles).slice(0, remainingSlots);
    if (newFiles.length > remainingSlots) {
      alert(t.print.fileLimitReached.replace("{max}", String(PRINT_MAX_FILE_COUNT)));
    }

    const validFiles: File[] = [];
    for (const f of candidates) {
      if (!PRINT_ALLOWED_TYPES.includes(f.type as (typeof PRINT_ALLOWED_TYPES)[number])) {
        alert(t.print.fileTypeInvalid.replace("{name}", f.name));
        continue;
      }
      if (f.size > PRINT_MAX_FILE_SIZE) {
        alert(
          t.print.fileTooLarge
            .replace("{name}", f.name)
            .replace("{size}", bytesToHumanReadable(f.size))
            .replace("{max}", bytesToHumanReadable(PRINT_MAX_FILE_SIZE))
        );
        continue;
      }
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        const validation = await validatePdfFile(f);
        if (!validation.valid) {
          alert(`${f.name}: ${validation.error || t.print.fileEncrypted}`);
          continue;
        }
      }
      validFiles.push(f);
    }
    if (validFiles.length === 0) return;

    setUploading(true);
    for (const f of validFiles) {
      const url = await uploadFile(f);
      if (!url) continue;

      let pageCount = 1;
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        pageCount = await getPdfPageCount(f);
      }

      const uploaded: UploadedFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: f.name,
        url,
        type: f.type,
        size: f.size,
        pageCount,
        blob: f,
        saveToLibrary: true,
      };
      setFiles((prev) => [...prev, uploaded]);
    }
    setUploading(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleSaveToLibrary = (id: string) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, saveToLibrary: !f.saveToLibrary } : f));
  };

  // Re-derive parsed range + per-page total whenever range or files change
  useEffect(() => {
    const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0) || pagesInput;
    if (!printRange.trim()) {
      setParsedRange(Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      setParsedRange(parsePrintRange(printRange, totalPages));
    }
  }, [printRange, files, pagesInput]);

  const printPrices = getPrintingPricing();
  const pricePerBW = printPrices.bwPerPage;
  const pricePerColor = printPrices.colorPerPage;
  const glossySurcharge = paperType === "glossy" ? printPrices.glossySurcharge : 0;
  const a3Surcharge = paperSize === "a3" ? printPrices.a3Surcharge : 0;
  const perPagePrice = (colorMode === "bw" ? pricePerBW : pricePerColor) + glossySurcharge + a3Surcharge;
  const effectivePages = parsedRange.length > 0 ? parsedRange.length : pagesInput;
  const subtotal = perPagePrice * effectivePages;
  const totalPrice = subtotal * copies;

  const handleAddToCart = () => {
    if (files.length === 0) { alert("Please upload at least one file"); return; }
    if (!isEnabled) { alert("Printing service is currently unavailable"); return; }

    const settings = {
      pages: effectivePages,
      copies,
      colorMode,
      sides,
      paperSize,
      orientation,
      paperType,
      perPagePrice,
      subtotal,
      printRange: printRange || undefined,
      fileUrls: files.map(f => f.url),
      fileNames: files.map(f => f.name),
      filePageCounts: files.map(f => f.pageCount),
    };

    cartStore.addItem({
      id: `print_${Date.now()}`,
      menu_item_id: `print_${Date.now()}`,
      vendor_id: PRINTING_VENDOR_ID,
      vendor_name: "MIIAM Print Store",
      name: `Print (${effectivePages}pg × ${copies}cp · ${colorMode})`,
      price: totalPrice,
      image_url: files[0].url,
      special_notes: JSON.stringify(settings),
    }, 1);

    if (files.length > 0) {
      let savedCount = 0;
      files.forEach((f) => {
        if (f.saveToLibrary) {
          library.addFile({
            name: f.name,
            url: f.url,
            size: f.size,
            type: f.type,
            id: `lib_${f.id}`,
          });
          library.incrementPrintCount(`lib_${f.id}`);
          savedCount++;
        }
      });
      if (savedCount > 0) {
        toast.addToast(t.print.librarySavedToast, "success");
      }
    }

    router.push("/app/cart");
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

  const totalDetectedPages = files.reduce((acc, f) => acc + f.pageCount, 0);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <PrintHero />

      <div className="p-6 -mt-4 space-y-4">
        <PrintFirstOrderCoupon />

        <div className="flex items-center justify-between gap-2 bg-surface-container rounded-2xl p-3 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-center gap-2 flex-1">
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
          <Link
            href="/app/printing/library"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-sm">folder</span>
            {t.print.libraryTitle}
          </Link>
        </div>

        {step === 1 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
              <span className="material-symbols-outlined text-indigo-600 text-sm">lock</span>
              <p className="text-xs text-indigo-700">{t.print.trustPrivacyDesc}</p>
            </div>

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
              <p className="text-xs text-on-surface-variant/60 mt-2">
                PDF, JPG, PNG (max {bytesToHumanReadable(PRINT_MAX_FILE_SIZE)} each · {PRINT_MAX_FILE_COUNT} files)
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-high rounded-xl">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-on-surface-variant">Uploading & counting pages...</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <p className="font-bold text-on-surface-variant">
                    {files.length}/{PRINT_MAX_FILE_COUNT} files · {totalDetectedPages} pages detected
                  </p>
                  <button
                    onClick={() => setFiles([])}
                    className="text-red-500 font-bold hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
                    <button
                      onClick={() => setPreviewFile({ name: f.name, url: f.url, type: f.type, size: f.size })}
                      className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-primary"
                      aria-label={t.print.filePreview}
                    >
                      {f.type === "application/pdf" ? (
                        <span className="material-symbols-outlined text-indigo-600 text-lg">description</span>
                      ) : (
                        <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{f.name}</p>
                      <p className="text-xs text-on-surface-variant/60">
                        {bytesToHumanReadable(f.size)} · {f.pageCount} {t.print.filePages}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSaveToLibrary(f.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        f.saveToLibrary
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-surface-container text-on-surface-variant/60"
                      }`}
                      title={t.print.librarySaveToggle}
                      aria-label={t.print.librarySaveToggle}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: f.saveToLibrary ? "'FILL' 1" : "'FILL' 0" }}>
                        bookmark
                      </span>
                    </button>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100"
                      aria-label="Remove file"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">close</span>
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setStep(2)}
                  disabled={files.length === 0}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Continue to Customize →
                </button>
              </div>
            )}

            {files.length === 0 && (
              <button
                onClick={() => setStep(2)}
                disabled
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Continue to Customize →
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-on-surface-variant block mb-2">Copies</label>
                  <input type="number" value={copies} onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant text-center" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-on-surface-variant block mb-2">
                    {totalDetectedPages > 0 ? `Pages (${totalDetectedPages} detected)` : "Pages"}
                  </label>
                  <input
                    type="number"
                    value={pagesInput}
                    onChange={(e) => setPagesInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant text-center"
                  />
                </div>
              </div>

              {totalDetectedPages > 0 && (
                <div>
                  <label className="text-xs font-bold text-on-surface-variant block mb-2">
                    {t.print.printRange}
                    <span className="text-on-surface-variant/60 font-normal ml-1">
                      ({parsedRange.length === totalDetectedPages ? t.print.printRangeAll : summarizeRange(parsedRange)})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={printRange}
                    onChange={(e) => setPrintRange(e.target.value)}
                    placeholder={t.print.printRangePlaceholder}
                    className="w-full p-3 bg-surface-container-high rounded-xl border border-outline-variant font-mono text-sm"
                  />
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">{t.print.printRangeHelp}</p>
                </div>
              )}

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

            <div className="pt-4 border-t border-outline-variant/10 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Per page</span><span className="font-bold">₹{perPagePrice}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Pages × {effectivePages}</span><span className="font-bold">₹{subtotal}</span></div>
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
              <div className="flex justify-between"><span className="text-on-surface-variant">Pages (effective)</span><span className="font-bold">{effectivePages}</span></div>
              {printRange.trim() && (
                <div className="flex justify-between"><span className="text-on-surface-variant">Range</span><span className="font-bold font-mono text-xs">{printRange}</span></div>
              )}
              <div className="flex justify-between"><span className="text-on-surface-variant">Copies</span><span className="font-bold">{copies}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Color</span><span className="font-bold capitalize">{colorMode === "bw" ? "Black & White" : "Color"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Sides</span><span className="font-bold capitalize">{sides} sided</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Paper</span><span className="font-bold uppercase">{paperSize} · {paperType === "glossy" ? "Glossy" : "Standard"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Orientation</span><span className="font-bold capitalize">{orientation}</span></div>
              <div className="pt-3 border-t border-outline-variant/10 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">₹{perPagePrice}/pg × {effectivePages} pg × {copies} copies</span><span className="font-bold">₹{totalPrice}</span></div>
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

        {step === 1 && (
          <>
            <WhyPrintWithMiiam />
            <PrintTestimonials />
          </>
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
