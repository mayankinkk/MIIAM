"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { usePrintLibraryStore } from "@/lib/store/printLibraryStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useRouter } from "next/navigation";

interface OrderItem {
  quantity: number;
  price?: number;
  menu_item?: { name: string } | null;
  special_notes?: string | null;
  [key: string]: unknown;
}

interface PrintSettings {
  fileUrls?: string[];
  fileNames?: string[];
  fileStatuses?: boolean[];
  pages?: number;
  copies?: number;
  colorMode?: string;
  paperSize?: string;
  orientation?: string;
  paperType?: string;
  sides?: string;
  addOns?: string[];
  rushTier?: string;
  rushLabel?: string;
}

interface OrderRecord {
  id: string;
  vendor_id: string;
  status: string;
  total_amount?: number;
  vendor?: { name?: string } | null;
  items?: OrderItem[];
  [key: string]: unknown;
}

interface OrderItemsListProps {
  order: OrderRecord;
  onChatVendor: () => void;
}

export default function OrderItemsList({ order, onChatVendor }: OrderItemsListProps) {
  const { t } = useTranslation();
  const library = usePrintLibraryStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  return (
    <>
      <div className="bg-surface-container rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm ${order.vendor_id === PRINTING_VENDOR_ID ? "text-indigo-600" : "text-primary"}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {order.vendor_id === PRINTING_VENDOR_ID ? "print" : "restaurant"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-on-surface">{order.vendor?.name || "Restaurant"}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onChatVendor}
            className="text-secondary font-bold text-sm flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-base">chat_bubble</span>
            Chat
          </button>
        </div>
        <div className="bg-white/50 rounded-2xl p-4 space-y-3">
          {order.items?.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-medium">{item.quantity}x {item.menu_item?.name || "Item"}</span>
              <span className="font-bold text-on-surface">₹{item.price?.toFixed(2) || "0.00"}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-on-surface font-bold">{t.orders.totalInclDelivery}</span>
            <span className="text-lg font-black text-primary">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
      </div>

      {/* Print File Details */}
      {order.vendor_id === PRINTING_VENDOR_ID && order.items?.map((item: OrderItem, idx: number) => {
        let settings: PrintSettings = {};
        try { if (item.special_notes) settings = JSON.parse(item.special_notes); } catch { /* corrupted data, ignore */ }
        const fileUrls: string[] = settings.fileUrls || [];
        const fileNames: string[] = settings.fileNames || [];
        if (fileUrls.length === 0 && fileNames.length === 0) return null;
        const fileStatuses: boolean[] = settings.fileStatuses || [];
        const printedCount = fileStatuses.filter(Boolean).length;

        return (
          <div key={idx} className="bg-surface-container rounded-2xl p-4 sm:p-6 space-y-3">
            <h3 className="font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">description</span>
              Print Files
              {fileStatuses.length > 0 && (
                <span className="ml-auto text-xs font-bold text-on-surface-variant">
                  {printedCount}/{fileStatuses.length} printed
                </span>
              )}
            </h3>
            {printedCount > 0 && fileStatuses.length > 0 && (
              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(printedCount / fileStatuses.length) * 100}%` }}
                />
              </div>
            )}
            <div className="space-y-2">
              {(fileNames.length > 0 ? fileNames : fileUrls).map((name: string, fi: number) => {
                const isPrinted = fileStatuses[fi] === true;
                return (
                  <div key={fi} className="flex items-center gap-3 bg-white/50 rounded-2xl p-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPrinted ? "bg-emerald-100" : "bg-indigo-100"
                    }`}>
                      <span className={`material-symbols-outlined text-sm ${
                        isPrinted ? "text-emerald-600" : "text-indigo-600"
                      }`}>
                        {isPrinted ? "check_circle" : "description"}
                      </span>
                    </div>
                    <span className="text-sm text-on-surface truncate flex-1">{name}</span>
                    {fileStatuses.length > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isPrinted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {isPrinted ? "PRINTED" : "IN QUEUE"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.pages && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{settings.pages} pages</span>}
              {settings.copies && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{settings.copies} copies</span>}
              {settings.colorMode && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.colorMode === "bw" ? "B&W" : "Color"}</span>}
              {settings.paperSize && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase">{settings.paperSize}</span>}
              {settings.orientation && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.orientation}</span>}
              {settings.paperType && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.paperType}</span>}
              {settings.sides && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.sides} sided</span>}
              {settings.addOns && settings.addOns.length > 0 && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                  +{settings.addOns.length} add-on{settings.addOns.length > 1 ? "s" : ""}
                </span>
              )}
              {settings.rushTier && settings.rushTier !== "standard" && (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
                  ⚡ {settings.rushLabel || settings.rushTier}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Print Again */}
      {order.vendor_id === PRINTING_VENDOR_ID && order.status === "delivered" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              let added = 0;
              order.items?.forEach((item: OrderItem) => {
                let settings: PrintSettings = {};
                try { if (item.special_notes) settings = JSON.parse(item.special_notes); } catch { /* corrupted data, ignore */ }
                const fileUrls: string[] = settings.fileUrls || [];
                const fileNames: string[] = settings.fileNames || [];
                const before = library.files.length;
                fileUrls.forEach((url, i) => {
                  library.addFile({ url, name: fileNames[i] || `print-${i + 1}.pdf`, size: 0, type: "application/pdf" });
                });
                added += Math.max(0, library.files.length - before);
              });
              addToast(added > 0 ? `Added ${added} file${added === 1 ? "" : "s"} to your library — one tap to re-print` : "Files already in your library", added > 0 ? "success" : "info");
              router.push("/app/printing/library");
            }}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 sm:py-5 text-base sm:text-lg font-extrabold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            {t.orders.printAgain}
          </button>
          <a
            href={`/api/printing/invoice?orderId=${order.id}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[var(--color-surface-container-lowest)] border-2 border-indigo-200 text-indigo-700 rounded-xl py-4 sm:py-5 text-base sm:text-lg font-extrabold hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">description</span>
            {t.orders.gstInvoice}
          </a>
        </div>
      )}
    </>
  );
}
