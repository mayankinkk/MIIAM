"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrintLibraryStore, type PrintLibraryItem } from "@/lib/store/printLibraryStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { usePrintSettingsStore } from "@/lib/store/printSettingsStore";
import { PRINTING_VENDOR_ID, PRINT_MENU_ITEM_ID } from "@/lib/constants";
import { getPrintingPricing } from "@/lib/printing-pricing";
import { bytesToHumanReadable } from "@/lib/printing-utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToastStore } from "@/lib/store/toastStore";
import PrintHero from "@/components/print/PrintHero";

export default function PrintLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { files, removeFile, clearAll, incrementPrintCount, MAX_ITEMS, MAX_BYTES } = usePrintLibraryStore();
  const cartStore = useCartStore();
  const serviceSettings = useServiceSettingsStore();
  const userDefaults = usePrintSettingsStore((s) => s.defaults);
  const toast = useToastStore();
  const [reprinting, setReprinting] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReprint = (item: PrintLibraryItem) => {
    if (!serviceSettings.isServiceEnabled("printing")) {
      toast.addToast("Printing service is currently unavailable", "error");
      return;
    }

    setReprinting(item.id);
    const pricing = getPrintingPricing();
    const copies = userDefaults.copies || 1;
    const pages = 1;
    const base = userDefaults.colorMode === "bw" ? pricing.bwPerPage : pricing.colorPerPage;
    const glossy = userDefaults.paperType === "glossy" ? pricing.glossySurcharge : 0;
    const a3 = userDefaults.paperSize === "a3" ? pricing.a3Surcharge : 0;
    const subtotal = (base + glossy + a3) * pages * copies;
    const settings = {
      pages,
      copies,
      colorMode: userDefaults.colorMode,
      sides: userDefaults.sides,
      paperSize: userDefaults.paperSize,
      orientation: userDefaults.orientation,
      paperType: userDefaults.paperType,
      quality: userDefaults.quality,
      perPagePrice: base + glossy + a3,
      subtotal,
      fileUrls: [item.url],
      fileNames: [item.name],
      fromLibrary: true,
    };

    cartStore.addItem({
      id: `print_lib_${Date.now()}`,
      menu_item_id: PRINT_MENU_ITEM_ID,
      vendor_id: PRINTING_VENDOR_ID,
      vendor_name: "MIIAM Print Store",
      name: `Re-print: ${item.name}`,
      price: subtotal,
      image_url: item.url,
      special_notes: JSON.stringify(settings),
    }, 1);
    incrementPrintCount(item.id);
    setReprinting(null);
    router.push("/app/cart");
  };

  const isEmpty = mounted && files.length === 0;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <PrintHero />

      <div className="p-6 -mt-4 space-y-4 pb-24">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-black text-on-surface">{t.print.libraryTitle}</h2>
            <Link
              href="/app/printing"
              className="text-sm font-bold text-primary"
            >
              ← {t.print.heroTitle}
            </Link>
          </div>
          <p className="text-sm text-on-surface-variant mb-3">{t.print.librarySubtitle}</p>

          {!mounted ? null : isEmpty ? (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-indigo-500">folder_off</span>
              </div>
              <p className="text-on-surface-variant mb-4">{t.print.libraryEmpty}</p>
              <Link
                href="/app/printing"
                className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold"
              >
                {t.print.calculatorCta} →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3 px-1">
                <span>
                  {files.length} / {MAX_ITEMS} · {bytesToHumanReadable(files.reduce((a, f) => a + f.size, 0))} / {bytesToHumanReadable(MAX_BYTES)}
                </span>
                <button
                  onClick={() => {
                    if (confirm("Clear all files from your library?")) clearAll();
                  }}
                  className="text-red-500 font-bold hover:underline"
                >
                  {t.print.libraryClearAll}
                </button>
              </div>

              <div className="space-y-2">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl border border-outline-variant/5"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.type === "application/pdf" ? (
                        <span className="material-symbols-outlined text-indigo-600">description</span>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {bytesToHumanReadable(item.size)} ·{" "}
                        {item.printCount > 0
                          ? t.print.libraryPrintCount.replace("{n}", String(item.printCount))
                          : t.print.libraryRecentlyAdded}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReprint(item)}
                      disabled={reprinting === item.id}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-black disabled:opacity-50"
                    >
                      {reprinting === item.id ? "..." : t.print.libraryAddToCart}
                    </button>
                    <button
                      onClick={() => removeFile(item.id)}
                      aria-label={t.print.libraryRemove}
                      className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100"
                    >
                      <span className="material-symbols-outlined text-red-500 text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
