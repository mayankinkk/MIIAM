"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { bytesToHumanReadable } from "@/lib/printing-utils";

export interface PreviewFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FilePreviewModalProps {
  file: PreviewFile | null;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation();
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;
    setPageCount(null);
    setImageDimensions(null);
    setLoading(true);

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => { setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight }); setLoading(false); };
      img.src = file.url;
      setPageCount(1);
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      // We can't read the file blob from the URL; estimate as 1 if unavailable.
      // For locally-uploaded File objects, the caller could pre-fetch count.
      setPageCount(null);
    }
  }, [file]);

  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [file, onClose]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.print.filePreview}
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-on-surface truncate">{file.name}</h3>
            <p className="text-xs text-on-surface-variant">
              {bytesToHumanReadable(file.size)}
              {pageCount ? ` · ${pageCount} ${t.print.filePages}` : ""}
              {imageDimensions ? ` · ${imageDimensions.w}×${imageDimensions.h}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.print.filePreviewClose}
            className="w-11 h-11 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-surface-container-low p-4 flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {file.type.startsWith("image/") ? (
            <img
              src={file.url}
              alt={file.name}
              className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-md transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}
            />
          ) : file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-[70vh] bg-white rounded-lg shadow-md border-0"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="text-on-surface-variant">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
