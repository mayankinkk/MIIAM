"use client";

import { useState, useRef } from "react";
import PerFileSettings, { type PerFileSettings as Pfs, DEFAULT_FILE_SETTINGS } from "./PerFileSettings";
import { bytesToHumanReadable } from "@/lib/printing-utils";

export interface PrintFileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  pageCount: number;
  saveToLibrary: boolean;
  settings: Pfs;
}

interface FileSettingsRowProps {
  file: PrintFileItem;
  index: number;
  onUpdate: (next: PrintFileItem) => void;
  onRemove: () => void;
  onPreview: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function FileSettingsRow({
  file,
  index,
  onUpdate,
  onRemove,
  onPreview,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: FileSettingsRowProps) {
  const [expanded, setExpanded] = useState(false);

  const handleSettingsChange = (next: Pfs) => {
    onUpdate({ ...file, settings: next });
  };

  const toggleSaveToLibrary = () => {
    onUpdate({ ...file, saveToLibrary: !file.saveToLibrary });
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`bg-surface-container-high rounded-xl border transition-all ${
        isDragging ? "opacity-50 border-primary border-dashed" : "border-outline-variant/5"
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <span
          className="material-symbols-outlined text-on-surface-variant/40 cursor-grab text-lg flex-shrink-0"
          aria-label="Drag to reorder"
        >
          drag_indicator
        </span>
        <button
          onClick={onPreview}
          className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-primary"
          aria-label="Preview file"
        >
          {file.type === "application/pdf" ? (
            <span className="material-symbols-outlined text-indigo-600 text-base">description</span>
          ) : (
            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
          )}
        </button>
        <button
          onClick={() => setExpanded((s) => !s)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-bold text-on-surface truncate">{file.name}</p>
          <p className="text-[11px] text-on-surface-variant/60">
            {bytesToHumanReadable(file.size)} · {file.pageCount} pg ·{" "}
            <span className="font-bold text-primary">
              {file.settings.copies}× {file.settings.colorMode === "bw" ? "B&W" : "Color"} {file.settings.paperSize.toUpperCase()}
            </span>
          </p>
        </button>
        <button
          onClick={toggleSaveToLibrary}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            file.saveToLibrary
              ? "bg-indigo-100 text-indigo-700"
              : "bg-surface-container text-on-surface-variant/60"
          }`}
          aria-label="Save to library"
          title="Save to library"
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: file.saveToLibrary ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
        <button
          onClick={() => setExpanded((s) => !s)}
          aria-label={expanded ? "Collapse settings" : "Expand settings"}
          className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            {expanded ? "expand_less" : "expand_more"}
          </span>
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove file"
          className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-100"
        >
          <span className="material-symbols-outlined text-red-500 text-sm">close</span>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-outline-variant/10">
          <PerFileSettings
            settings={file.settings}
            onChange={handleSettingsChange}
            compact={false}
            pageCount={file.pageCount}
          />
        </div>
      )}
    </div>
  );
}

export { DEFAULT_FILE_SETTINGS };
