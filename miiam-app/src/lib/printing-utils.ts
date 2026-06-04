export const PRINT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Blinkit parity)
export const PRINT_MAX_FILE_COUNT = 15; // Blinkit parity
export const PRINT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
] as const;

export type AllowedPrintType = (typeof PRINT_ALLOWED_TYPES)[number];

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  pageCount?: number;
  encrypted?: boolean;
}

export async function readPdfFirstBytes(file: File, bytes = 8192): Promise<string> {
  const slice = file.slice(0, Math.min(bytes, file.size));
  const buffer = await slice.arrayBuffer();
  let binary = "";
  const chunk = 1024;
  for (let i = 0; i < buffer.byteLength; i += chunk) {
    const sub = new Uint8Array(buffer, i, Math.min(chunk, buffer.byteLength - i));
    binary += String.fromCharCode(...sub);
  }
  return binary;
}

export function extractPdfPageCountFromText(text: string): number | null {
  // PDF stores the page count in /Pages /Count N near the start of the file.
  // Match the first occurrence of /Count followed by whitespace and a number.
  const m = text.match(/\/Count\s+(-?\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getPdfPageCount(file: File): Promise<number> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return 1;
  }
  try {
    const text = await readPdfFirstBytes(file);
    const count = extractPdfPageCountFromText(text);
    if (count) return count;
    // Fallback: count /Type /Page (not /Pages) references in the first 64KB
    const extended = await readPdfFirstBytes(file, 65536);
    const pageRefs = (extended.match(/\/Type\s*\/Page(?!s)/g) || []).length;
    return pageRefs > 0 ? pageRefs : 1;
  } catch {
    return 1;
  }
}

export function isPdfEncrypted(text: string): boolean {
  // Encrypted PDFs declare an /Encrypt dictionary entry
  return /\/Encrypt\s*\/[A-Za-z]/.test(text) || /\/Encrypt\s*\d/.test(text);
}

export function isPdfImageOnly(text: string): boolean {
  // Heuristic: a scanned PDF has many /XObject /Image but no /Font references.
  const hasImage = (text.match(/\/Subtype\s*\/Image/g) || []).length;
  const hasFont = (text.match(/\/Type\s*\/Font/g) || []).length;
  return hasImage > 5 && hasFont === 0;
}

export async function validatePdfFile(file: File): Promise<PdfValidationResult> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: true };
  }
  try {
    const text = await readPdfFirstBytes(file);
    if (isPdfEncrypted(text)) {
      return {
        valid: false,
        error: "This PDF is password-protected. Please remove the password and try again.",
        encrypted: true,
      };
    }
    const pageCount = extractPdfPageCountFromText(text);
    return { valid: true, pageCount: pageCount ?? undefined };
  } catch (e) {
    return { valid: true };
  }
}

export function parsePrintRange(input: string, maxPages: number): number[] {
  if (!input) return Array.from({ length: maxPages }, (_, i) => i + 1);
  const cleaned = input.replace(/\s+/g, "");
  if (!cleaned) return Array.from({ length: maxPages }, (_, i) => i + 1);
  const out = new Set<number>();
  const parts = cleaned.split(",");
  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [aStr, bStr] = part.split("-");
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      const lo = Math.max(1, Math.min(a, b));
      const hi = Math.min(maxPages, Math.max(a, b));
      for (let i = lo; i <= hi; i++) out.add(i);
    } else {
      const n = parseInt(part, 10);
      if (Number.isNaN(n)) continue;
      if (n >= 1 && n <= maxPages) out.add(n);
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}

export function summarizeRange(pages: number[]): string {
  if (pages.length === 0) return "—";
  if (pages.length === 1) return `p.${pages[0]}`;
  const first = pages[0];
  const last = pages[pages.length - 1];
  if (last - first + 1 === pages.length) return `p.${first}–${last}`;
  return `${pages.length} pages`;
}

export function isRangeEquivalentToAll(pages: number[], maxPages: number): boolean {
  if (pages.length !== maxPages) return false;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i] !== i + 1) return false;
  }
  return true;
}

export function bytesToHumanReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
