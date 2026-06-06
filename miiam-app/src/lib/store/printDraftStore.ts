"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ColorMode, FlipDirection, Orientation, PaperSize, PaperType, PrintQuality, PrintSides } from "./printSettingsStore";

export interface DraftFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  pageCount: number;
}

export interface PrintDraft {
  files: DraftFile[];
  colorMode: ColorMode;
  sides: PrintSides;
  flipDirection: FlipDirection;
  paperSize: PaperSize;
  orientation: Orientation;
  paperType: PaperType;
  quality: PrintQuality;
  copies: number;
  printRange: string;
  savedAt: number;
}

interface PrintDraftStore {
  draft: PrintDraft | null;
  saveDraft: (draft: Omit<PrintDraft, "savedAt">) => void;
  clearDraft: () => void;
  isDraft: () => boolean;
  draftAge: () => number | null;
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const usePrintDraftStore = create<PrintDraftStore>()(
  persist(
    (set, get) => ({
      draft: null,

      saveDraft: (draft) => {
        set({ draft: { ...draft, savedAt: Date.now() } });
      },

      clearDraft: () => set({ draft: null }),

      isDraft: () => {
        const d = get().draft;
        if (!d) return false;
        const isValid = Date.now() - d.savedAt < MAX_AGE_MS;
        // Auto-clean expired drafts
        if (!isValid) {
          set({ draft: null });
          return false;
        }
        return true;
      },

      draftAge: () => {
        const d = get().draft;
        if (!d) return null;
        return Date.now() - d.savedAt;
      },
    }),
    { name: "miiam-print-draft" }
  )
);
