import { describe, it, expect } from "vitest";
import {
  parsePrintRange,
  isRangeEquivalentToAll,
  extractPdfPageCountFromText,
  isPdfEncrypted,
  isPdfImageOnly,
  bytesToHumanReadable,
  summarizeRange,
  PRINT_MAX_FILE_SIZE,
  PRINT_MAX_FILE_COUNT,
} from "../printing-utils";

describe("parsePrintRange", () => {
  it("returns all pages when input is empty", () => {
    expect(parsePrintRange("", 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("parses single pages", () => {
    expect(parsePrintRange("3", 10)).toEqual([3]);
  });

  it("parses comma-separated pages", () => {
    expect(parsePrintRange("1,3,5", 10)).toEqual([1, 3, 5]);
  });

  it("parses ranges with dash", () => {
    expect(parsePrintRange("1-5", 10)).toEqual([1, 2, 3, 4, 5]);
  });

  it("parses mixed ranges and singles", () => {
    expect(parsePrintRange("1-3, 5, 8-10", 12)).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  it("ignores invalid numbers", () => {
    expect(parsePrintRange("abc, 3, xyz", 10)).toEqual([3]);
  });

  it("clamps ranges to maxPages", () => {
    expect(parsePrintRange("1-20", 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles reversed range", () => {
    expect(parsePrintRange("5-3", 10)).toEqual([3, 4, 5]);
  });

  it("deduplicates overlapping ranges", () => {
    expect(parsePrintRange("1-5, 3-7", 10)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("tolerates whitespace", () => {
    expect(parsePrintRange("  1 - 3 ,  7 ", 10)).toEqual([1, 2, 3, 7]);
  });
});

describe("isRangeEquivalentToAll", () => {
  it("returns true for full sequential range", () => {
    expect(isRangeEquivalentToAll([1, 2, 3, 4, 5], 5)).toBe(true);
  });

  it("returns false for partial range", () => {
    expect(isRangeEquivalentToAll([1, 2, 3], 5)).toBe(false);
  });

  it("returns false for non-sequential", () => {
    expect(isRangeEquivalentToAll([1, 2, 4, 5], 5)).toBe(false);
  });
});

describe("extractPdfPageCountFromText", () => {
  it("extracts count from /Count N pattern", () => {
    const text = "%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 7 /Kids [...]";
    expect(extractPdfPageCountFromText(text)).toBe(7);
  });

  it("returns null when no count found", () => {
    expect(extractPdfPageCountFromText("not a pdf")).toBe(null);
  });

  it("ignores non-numeric counts", () => {
    expect(extractPdfPageCountFromText("/Count foo")).toBe(null);
  });
});

describe("isPdfEncrypted", () => {
  it("detects /Encrypt dictionary entry", () => {
    expect(isPdfEncrypted("... << /Encrypt 8 0 R ...")).toBe(true);
    expect(isPdfEncrypted("... /Encrypt /StdCF ...")).toBe(true);
  });

  it("returns false for non-encrypted PDFs", () => {
    expect(isPdfEncrypted("... /Type /Catalog ...")).toBe(false);
  });
});

describe("isPdfImageOnly", () => {
  it("detects scanned/image-only PDFs", () => {
    const text = "a".repeat(100) + "/Subtype/Image".repeat(10);
    expect(isPdfImageOnly(text)).toBe(true);
  });

  it("returns false for text PDFs", () => {
    const text = "/Type/Font /Subtype/Image";
    expect(isPdfImageOnly(text)).toBe(false);
  });
});

describe("bytesToHumanReadable", () => {
  it("formats bytes", () => {
    expect(bytesToHumanReadable(500)).toBe("500 B");
  });

  it("formats KB", () => {
    expect(bytesToHumanReadable(2048)).toBe("2.0 KB");
  });

  it("formats MB", () => {
    expect(bytesToHumanReadable(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("summarizeRange", () => {
  it("returns single-page label", () => {
    expect(summarizeRange([3])).toBe("p.3");
  });

  it("returns contiguous range label", () => {
    expect(summarizeRange([1, 2, 3, 4, 5])).toBe("p.1–5");
  });

  it("returns count for non-contiguous", () => {
    expect(summarizeRange([1, 3, 5, 7])).toBe("4 pages");
  });
});

describe("Print limits match Blinkit parity", () => {
  it("max file size is 50MB", () => {
    expect(PRINT_MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });

  it("max file count is 15", () => {
    expect(PRINT_MAX_FILE_COUNT).toBe(15);
  });
});
