"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { usePrintLibraryStore } from "@/lib/store/printLibraryStore";
import { usePrintSettingsStore, QUALITY_MULTIPLIER } from "@/lib/store/printSettingsStore";
import { usePrintDraftStore } from "@/lib/store/printDraftStore";
import { usePrintAddonsStore } from "@/lib/store/printAddonsStore";
import { useToastStore } from "@/lib/store/toastStore";
import { PRINTING_VENDOR_ID, PRINT_MENU_ITEM_ID } from "@/lib/constants";
import { getPrintingPricing } from "@/lib/printing-pricing";
import {
  ADDON_CATALOG,
  calculateAddOnCost,
  getAddOnPricing,
  rushEtaMinutes,
  rushLabel,
  rushMultiplier,
} from "@/lib/printing-addons";
import { useTranslation } from "@/lib/i18n/useTranslation";
import PrintHero from "@/components/print/PrintHero";
import WhyPrintWithMiiam from "@/components/print/WhyPrintWithMiiam";
import PrintTestimonials from "@/components/print/PrintTestimonials";
import FilePreviewModal, { type PreviewFile } from "@/components/print/FilePreviewModal";
import FileSettingsRow, { type PrintFileItem, DEFAULT_FILE_SETTINGS } from "@/components/print/FileSettingsRow";
import PrintAddOns from "@/components/print/PrintAddOns";
import BulkOrderShortcuts from "@/components/print/BulkOrderShortcuts";
import PrintServiceGrid, { type ServicePreset } from "@/components/print/PrintServiceGrid";
import {
  PRINT_ALLOWED_TYPES,
  PRINT_MAX_FILE_SIZE,
  PRINT_MAX_FILE_COUNT,
  bytesToHumanReadable,
  getPdfPageCount,
  parsePrintRange,
  validatePdfFile,
} from "@/lib/printing-utils";

const STEPS = ["Upload", "Customize", "Checkout"] as const;

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PrintingPage() {
  const [step, setStep] = useState(1);
  const [activeService, setActiveService] = useState<ServicePreset | null>(null);
  const [files, setFiles] = useState<PrintFileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [draftPromptShown, setDraftPromptShown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const cartStore = useCartStore();
  const serviceSettings = useServiceSettingsStore();
  const library = usePrintLibraryStore();
  const defaults = usePrintSettingsStore((s) => s.defaults);
  const setDefault = usePrintSettingsStore((s) => s.setDefault);
  const setDefaults = usePrintSettingsStore((s) => s.setDefaults);
  const draft = usePrintDraftStore((s) => s.draft);
  const saveDraft = usePrintDraftStore((s) => s.saveDraft);
  const clearDraft = usePrintDraftStore((s) => s.clearDraft);
  const toast = useToastStore();
  const printAddons = usePrintAddonsStore();
  const { t } = useTranslation();

  const isEnabled = serviceSettings.isServiceEnabled("printing");

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `prints/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(fileName, file);
    if (uploadError) {
      toast.addToast("Upload failed. Make sure the 'menu-images' bucket exists.", "error");
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const makeFileItem = (f: {
    id?: string;
    name: string;
    url: string;
    type: string;
    size: number;
    pageCount: number;
    saveToLibrary?: boolean;
  }): PrintFileItem => ({
    id: f.id || `${Date.now()}-${Math.random()}`,
    name: f.name,
    url: f.url,
    type: f.type,
    size: f.size,
    pageCount: f.pageCount,
    saveToLibrary: f.saveToLibrary ?? true,
    settings: { ...DEFAULT_FILE_SETTINGS, ...defaults },
  });

  const handleFilesSelected = async (newFiles: FileList | File[]) => {
    const remainingSlots = PRINT_MAX_FILE_COUNT - files.length;
    if (remainingSlots <= 0) {
      toast.addToast(t.print.fileLimitReached.replace("{max}", String(PRINT_MAX_FILE_COUNT)), "error");
      return;
    }
    const candidates = Array.from(newFiles).slice(0, remainingSlots);
    if (newFiles.length > remainingSlots) {
      toast.addToast(t.print.fileLimitReached.replace("{max}", String(PRINT_MAX_FILE_COUNT)), "error");
    }

    const validFiles: File[] = [];
    for (const f of candidates) {
      if (!PRINT_ALLOWED_TYPES.includes(f.type as (typeof PRINT_ALLOWED_TYPES)[number])) {
        toast.addToast(t.print.fileTypeInvalid.replace("{name}", f.name), "error");
        continue;
      }
      if (f.size > PRINT_MAX_FILE_SIZE) {
        toast.addToast(
          t.print.fileTooLarge
            .replace("{name}", f.name)
            .replace("{size}", bytesToHumanReadable(f.size))
            .replace("{max}", bytesToHumanReadable(PRINT_MAX_FILE_SIZE)),
          "error"
        );
        continue;
      }
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        const validation = await validatePdfFile(f);
        if (!validation.valid) {
          toast.addToast(`${f.name}: ${validation.error || t.print.fileEncrypted}`, "error");
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

      setFiles((prev) => [...prev, makeFileItem({
        name: f.name,
        url,
        type: f.type,
        size: f.size,
        pageCount,
      })]);
    }
    setUploading(false);
  };

  const updateFile = (id: string, next: PrintFileItem) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? next : f)));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const reorderFile = (from: number, to: number) => {
    if (from === to) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const applyToAll = () => {
    if (files.length === 0) return;
    const first = files[0].settings;
    setFiles((prev) => prev.map((f) => ({ ...f, settings: { ...first } })));
  };

  const handleServiceSelect = (preset: ServicePreset) => {
    setActiveService(preset);
    const colorMode: "bw" | "color" = preset === "color" || preset === "photo" ? "color" : "bw";
    const baseDefaults: Partial<typeof defaults> = { colorMode };

    if (preset === "bulk") {
      setDefaults({ ...baseDefaults, copies: 50, paperType: "standard" });
    } else if (preset === "reports") {
      setDefaults({ ...baseDefaults, paperType: "standard", quality: "high", sides: "double" });
    } else if (preset === "photo") {
      setDefaults({ ...baseDefaults, paperType: "glossy", quality: "high" });
    } else if (preset === "spiral" || preset === "soft" || preset === "hard") {
      const addOnId = preset === "spiral" ? "binding_spiral" : preset === "soft" ? "binding_soft" : "binding_hard";
      setDefaults(baseDefaults);
      if (!printAddons.selected.includes(addOnId)) {
        printAddons.toggle(addOnId);
      }
    } else if (preset === "lamination_a4") {
      setDefaults(baseDefaults);
      if (!printAddons.selected.includes("lamination_a4")) printAddons.toggle("lamination_a4");
    } else if (preset === "lamination_id") {
      setDefaults(baseDefaults);
      if (!printAddons.selected.includes("lamination_id")) printAddons.toggle("lamination_id");
    } else {
      setDefaults(baseDefaults);
    }
  };

  const handleSaveAsDefault = () => {
    if (files.length === 0) return;
    const first = files[0].settings;
    setDefaults({
      colorMode: first.colorMode,
      sides: first.sides,
      flipDirection: first.flipDirection,
      paperSize: first.paperSize,
      orientation: first.orientation,
      paperType: first.paperType,
      quality: first.quality,
      copies: first.copies,
    });
    toast.addToast(t.print.defaultsSaved, "success");
  };

  const handleSaveDraft = () => {
    saveDraft({
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
        pageCount: f.pageCount,
        settings: { ...f.settings },
      })),
      colorMode: defaults.colorMode,
      sides: defaults.sides,
      flipDirection: defaults.flipDirection,
      paperSize: defaults.paperSize,
      orientation: defaults.orientation,
      paperType: defaults.paperType,
      quality: defaults.quality,
      copies: defaults.copies,
      printRange: "",
    });
    toast.addToast(t.print.draftSaved, "success");
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    const restoredFiles = draft.files.map((f) => {
      const item = makeFileItem(f);
      if (f.settings) {
        item.settings = { ...item.settings, ...f.settings };
      }
      return item;
    });
    setFiles(restoredFiles);
    setDefaults({
      colorMode: draft.colorMode,
      sides: draft.sides,
      flipDirection: draft.flipDirection,
      paperSize: draft.paperSize,
      orientation: draft.orientation,
      paperType: draft.paperType,
      quality: draft.quality,
      copies: draft.copies,
    });
    clearDraft();
    toast.addToast(t.print.draftResume, "info");
  };

  const handleDiscardDraft = () => {
    clearDraft();
    toast.addToast(t.print.draftDiscarded, "info");
  };

  // Compute pricing from per-file settings
  const printPrices = getPrintingPricing();
  const fileSubtotals = files.map((f) => {
    const base = f.settings.colorMode === "bw" ? printPrices.bwPerPage : printPrices.colorPerPage;
    const glossy = f.settings.paperType === "glossy" ? printPrices.glossySurcharge : 0;
    const a3 = f.settings.paperSize === "a3" ? printPrices.a3Surcharge : 0;
    const perPage = (base + glossy + a3) * QUALITY_MULTIPLIER[f.settings.quality];
    const pagesInRange = f.settings.range.trim()
      ? parsePrintRange(f.settings.range, f.pageCount).length
      : f.pageCount;
    return perPage * pagesInRange * f.settings.copies;
  });
  const totalCopies = files.reduce((acc, f) => acc + f.settings.copies, 0);
  const totalPrice = fileSubtotals.reduce((acc, n) => acc + n, 0);
  const totalPagesEffective = files.reduce(
    (acc, f) =>
      acc +
      (f.settings.range.trim()
        ? parsePrintRange(f.settings.range, f.pageCount).length
        : f.pageCount) *
        f.settings.copies,
    0
  );

  const addOnPricing =
    typeof window === "undefined"
      ? {
          coverPage: 10, collatePerPage: 0.5, holePunch2: 8, holePunch3: 10, holePunch4: 12,
          foldBi: 5, foldTri: 8, bindingSpiral: 35, bindingSoft: 80, bindingHard: 150,
          laminationA4: 25, laminationId: 15, rush30Multiplier: 1.4, rush15Multiplier: 1.85,
        }
      : getAddOnPricing();
  const addOnsTotal = printAddons.selected.reduce(
    (acc, id) => acc + calculateAddOnCost(id, addOnPricing, { totalPages: totalPagesEffective, copies: totalCopies }),
    0
  );
  const rushMult = rushMultiplier(printAddons.rushTier, addOnPricing);
  const baseSubtotal = totalPrice + addOnsTotal;
  const grandTotal = baseSubtotal * rushMult;
  const etaMinutes = rushEtaMinutes(printAddons.rushTier);

  const handleAddToCart = () => {
    if (files.length === 0) { toast.addToast("Please upload at least one file", "error"); return; }
    if (!isEnabled) { toast.addToast("Printing service is currently unavailable", "error"); return; }

    const firstFile = files[0];
    const settings = {
      pages: totalPagesEffective,
      copies: firstFile.settings.copies,
      colorMode: firstFile.settings.colorMode,
      paperSize: firstFile.settings.paperSize,
      orientation: firstFile.settings.orientation,
      sides: firstFile.settings.sides,
      paperType: firstFile.settings.paperType,
      quality: firstFile.settings.quality,
      fileUrls: files.map((f) => f.url),
      fileNames: files.map((f) => f.name),
      perFile: files.map((f) => ({
        fileUrl: f.url,
        fileName: f.name,
        pageCount: f.pageCount,
        ...f.settings,
      })),
      addOns: printAddons.selected.map((id) => {
        const desc = ADDON_CATALOG.find((a) => a.id === id);
        return { id, label: desc?.label || id };
      }),
      rushTier: printAddons.rushTier,
      rushLabel: rushLabel(printAddons.rushTier),
      rushMultiplier: rushMult,
      etaMinutes,
      totalPages: totalPagesEffective,
      subtotal: grandTotal,
      baseSubtotal,
      addOnsTotal,
    };

    cartStore.addItem({
      id: `print_${Date.now()}`,
      menu_item_id: PRINT_MENU_ITEM_ID,
      vendor_id: PRINTING_VENDOR_ID,
      vendor_name: "MIIAM Print Store",
      name: `Print (${totalPagesEffective}pg · ETA ${etaMinutes}m)`,
      price: grandTotal,
      image_url: files[0].url,
      special_notes: JSON.stringify(settings),
    }, 1);

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
    if (draft) {
      clearDraft();
    }
    printAddons.clear();
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
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">
      <PrintHero />

      <div className="px-3 sm:px-6 py-4 sm:py-6 -mt-4 space-y-4 pb-24">
        {/* Draft prompt */}
        {draft && files.length === 0 && !draftPromptShown && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600">history</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">
                {t.print.draftFound.replace("{when}", formatRelativeTime(draft.savedAt))}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {draft.files.length} file{draft.files.length > 1 ? "s" : ""} · {draft.colorMode} · {draft.paperSize}
              </p>
            </div>
            <button
              onClick={handleResumeDraft}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold"
            >
              {t.print.draftResume}
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold"
            >
              {t.print.draftDiscard}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container rounded-2xl p-3 shadow-sm border border-outline-variant/10">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0">
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
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Link
              href="/app/printing/library"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">folder</span>
              {t.print.libraryTitle}
            </Link>
            <Link
              href="/app/printing/passport"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">face</span>
              Passport / ID Photos
            </Link>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-6">
            <PrintServiceGrid activePreset={activeService} onSelect={handleServiceSelect} />

            {activeService && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-xs text-indigo-800">
                <span className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="material-symbols-outlined text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="break-words">{t.print.services.servicesActive.replace("{name}", t.print.services[`${activeService === "lamination_a4" ? "lamA4" : activeService === "lamination_id" ? "lamId" : activeService}Title` as keyof typeof t.print.services] as string)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveService(null)}
                  className="text-indigo-700 font-black hover:underline flex-shrink-0"
                >
                  {t.print.services.servicesChange}
                </button>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
              <span className="material-symbols-outlined text-indigo-600 text-sm">lock</span>
              <p className="text-xs text-indigo-700">{t.print.trustPrivacyDesc}</p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesSelected(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-10 text-center cursor-pointer transition-all ${
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
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="material-symbols-outlined text-2xl sm:text-3xl text-indigo-600">cloud_upload</span>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-on-surface-variant">
                      {files.length}/{PRINT_MAX_FILE_COUNT} files · {totalDetectedPages} pages
                    </p>
                    <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
                      {t.print.reorderFiles}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={applyToAll}
                      className="px-2.5 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                    >
                      {t.print.applyToAll}
                    </button>
                    <button
                      onClick={handleSaveAsDefault}
                      className="px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold"
                    >
                      {t.print.saveAsDefault}
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="px-2.5 py-1.5 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold"
                    >
                      {t.print.saveDraft}
                    </button>
                    <button
                      onClick={() => setFiles([])}
                      className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {files.length > 0 && (
                    <BulkOrderShortcuts
                      copies={files[0]?.settings.copies || 1}
                      onChange={(n) => {
                        if (files.length === 0) return;
                        setFiles((prev) => prev.map((f) => ({ ...f, settings: { ...f.settings, copies: n } })));
                      }}
                    />
                  )}
                  {files.map((f, idx) => (
                    <FileSettingsRow
                      key={f.id}
                      file={f}
                      index={idx}
                      onUpdate={(next) => updateFile(f.id, next)}
                      onRemove={() => removeFile(f.id)}
                      onPreview={() => setPreviewFile({ name: f.name, url: f.url, type: f.type, size: f.size })}
                      onDragStart={(_e, i) => setDragIndex(i)}
                      onDragOver={(e, _i) => { e.preventDefault(); }}
                      onDrop={(_e, i) => {
                        if (dragIndex !== null) reorderFile(dragIndex, i);
                        setDragIndex(null);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      isDragging={dragIndex === idx}
                    />
                  ))}
                </div>

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
          <div className="space-y-4">
            <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-on-surface">Per-file summary</p>
                <button
                  onClick={() => setStep(1)}
                  className="text-primary text-xs font-bold"
                >
                  ← Edit
                </button>
              </div>
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-surface-container-high rounded-lg text-xs">
                  <span className="truncate flex-1 font-bold text-on-surface">{f.name}</span>
                  <span className="ml-2 text-on-surface-variant">
                    {f.settings.copies}× {f.settings.colorMode === "bw" ? "B&W" : "Color"} · {f.settings.sides} · {f.settings.paperSize.toUpperCase()} · {f.settings.quality}
                  </span>
                </div>
              ))}
            </div>

            <PrintAddOns totalPages={totalPagesEffective} copies={totalCopies} />

            <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Effective pages</span><span className="font-bold">{totalPagesEffective}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Print subtotal</span><span className="font-bold">₹{totalPrice.toFixed(2)}</span></div>
              {addOnsTotal > 0 && (
                <div className="flex justify-between"><span className="text-on-surface-variant">Add-ons</span><span className="font-bold">₹{addOnsTotal.toFixed(2)}</span></div>
              )}
              {rushMult !== 1 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{rushLabel(printAddons.rushTier)} (×{rushMult.toFixed(2)})</span>
                  <span className="font-bold">+{Math.round((rushMult - 1) * 100)}%</span>
                </div>
              )}
              <div className="pt-2 border-t border-outline-variant/10 flex justify-between text-base">
                <span className="font-bold">Total · ETA {etaMinutes} min</span>
                <span className="text-xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 min-w-0 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 min-w-0 py-4 bg-primary text-white rounded-xl font-bold">Review Order →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-surface-container rounded-2xl p-6 shadow-sm border border-outline-variant/10 space-y-4">
            <h3 className="font-bold text-lg">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Files</span><span className="font-bold">{files.length}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Effective pages</span><span className="font-bold">{totalPagesEffective}</span></div>
              <div className="pt-2 space-y-1">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-on-surface-variant flex-1">{f.name}</span>
                    <span className="font-bold ml-2">
                      {f.settings.copies}× {f.settings.colorMode === "bw" ? "B&W" : "Color"}
                    </span>
                  </div>
                ))}
              </div>
              {printAddons.selected.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-xs font-bold text-on-surface-variant">Add-ons</p>
                  {printAddons.selected.map((id) => {
                    const desc = ADDON_CATALOG.find((a) => a.id === id);
                    const cost = calculateAddOnCost(id, addOnPricing, { totalPages: totalPagesEffective, copies: totalCopies });
                    return (
                      <div key={id} className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant">+ {desc?.label}</span>
                        <span className="font-bold">₹{cost.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {printAddons.rushTier !== "standard" && (
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">{rushLabel(printAddons.rushTier)}</span>
                  <span className="font-bold text-primary">ETA {etaMinutes} min</span>
                </div>
              )}
              <div className="pt-3 border-t border-outline-variant/10 space-y-1">
                <div className="flex justify-between text-lg pt-1">
                  <span className="font-black">Total</span>
                  <span className="text-2xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
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
