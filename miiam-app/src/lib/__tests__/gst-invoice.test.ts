import { describe, it, expect } from "vitest";
import { generateInvoicePdf, GST_INVOICE_TAX_RATE, type InvoiceData } from "../gst-invoice";

const baseData: InvoiceData = {
  invoiceNumber: "MIIAM-PRI-TEST0001",
  invoiceDate: "2026-06-04",
  orderId: "abcdef12-3456-7890",
  seller: {
    name: "MIIAM Print Services",
    address: "Plot 14, Sector 18, MG Road, Bengaluru, Karnataka 560001",
    gstin: "29ABCDE1234F1Z5",
    state: "Karnataka (29)",
  },
  buyer: {
    name: "Priya Sharma",
    address: "123 Indiranagar, Bengaluru",
    email: "priya@example.com",
    state: "Karnataka (29)",
  },
  lines: [
    { description: "Print job (B&W, A4, 2-sided, 10 pages)", quantity: 1, unitPrice: 100, amount: 100 },
    { description: "Spiral binding", quantity: 1, unitPrice: 35, amount: 35 },
  ],
  subtotal: 135,
  cgst: 135 * GST_INVOICE_TAX_RATE * 0.5,
  sgst: 135 * GST_INVOICE_TAX_RATE * 0.5,
  igst: 0,
  total: 135 * (1 + GST_INVOICE_TAX_RATE),
  paymentMode: "Online",
};

describe("gst-invoice", () => {
  it("generates a valid PDF buffer", () => {
    const buf = generateInvoicePdf(baseData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(200);
    const head = buf.toString("latin1", 0, 8);
    expect(head).toBe("%PDF-1.4");
  });

  it("embeds seller GSTIN", () => {
    const buf = generateInvoicePdf(baseData);
    const str = buf.toString("latin1");
    expect(str).toContain("29ABCDE1234F1Z5");
  });

  it("embeds invoice number", () => {
    const buf = generateInvoicePdf(baseData);
    const str = buf.toString("latin1");
    expect(str).toContain("MIIAM-PRI-TEST0001");
  });

  it("embeds line items", () => {
    const buf = generateInvoicePdf(baseData);
    const str = buf.toString("latin1");
    expect(str).toContain("Spiral binding");
    expect(str).toContain("Print job");
  });

  it("escapes PDF special characters in strings", () => {
    const data: InvoiceData = {
      ...baseData,
      buyer: { ...baseData.buyer, name: "Test (Parentheses) \\Backslash" },
    };
    const buf = generateInvoicePdf(data);
    const str = buf.toString("latin1");
    expect(str).toContain("Test \\(Parentheses\\) \\\\Backslash");
  });

  it("handles IGST-only interstate transactions", () => {
    const data: InvoiceData = {
      ...baseData,
      buyer: { ...baseData.buyer, state: "Maharashtra (27)" },
      cgst: 0,
      sgst: 0,
      igst: 135 * GST_INVOICE_TAX_RATE,
    };
    const buf = generateInvoicePdf(data);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("produces end-of-file marker", () => {
    const buf = generateInvoicePdf(baseData);
    const tail = buf.toString("latin1").trimEnd();
    expect(tail.endsWith("%%EOF")).toBe(true);
  });
});
