export interface PrintingPricing {
  bwPerPage: number;
  colorPerPage: number;
  glossySurcharge: number;
  a3Surcharge: number;
}

const STORAGE_KEY = "miiam-printing-pricing";

const defaultPricing: PrintingPricing = {
  bwPerPage: 2,
  colorPerPage: 10,
  glossySurcharge: 5,
  a3Surcharge: 3,
};

export function getPrintingPricing(): PrintingPricing {
  if (typeof window === "undefined") return defaultPricing;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPricing, ...parsed };
    }
  } catch (e) {
    console.warn("[printing-pricing] Failed to parse stored pricing, using defaults:", e);
  }
  return defaultPricing;
}

export function savePrintingPricing(pricing: PrintingPricing): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pricing));
  } catch (e) {
    console.error("[printing-pricing] Failed to save pricing to localStorage:", e);
  }
}
