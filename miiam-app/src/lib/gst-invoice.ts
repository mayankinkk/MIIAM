export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  seller: {
    name: string;
    address: string;
    gstin: string;
    state: string;
  };
  buyer: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    state: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  paymentMode: string;
  notes?: string;
}

const TAX_RATE = 0.18;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;

function escapePdfText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatINR(n: number): string {
  return "Rs. " + n.toFixed(2);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current.length) {
      current = word;
      continue;
    }
    if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const lines: string[] = [];
  const drawings: string[] = [];

  let cursorY = 80;

  // Title bar
  drawings.push(`0.85 0.85 0.85 rg`);
  drawings.push(`${MARGIN} ${PAGE_HEIGHT - 80} ${PAGE_WIDTH - 2 * MARGIN} 28 re f`);
  drawings.push(`0 0 0 rg`);
  lines.push(
    `BT /F2 18 Tf ${MARGIN + 8} ${PAGE_HEIGHT - 65} Td (TAX INVOICE) Tj ET`
  );
  lines.push(
    `BT /F1 9 Tf ${PAGE_WIDTH - MARGIN - 220} ${PAGE_HEIGHT - 65} Td (Invoice #: ${escapePdfText(data.invoiceNumber)}) Tj ET`
  );

  cursorY = PAGE_HEIGHT - 110;

  // Seller block
  lines.push(
    `BT /F2 10 Tf ${MARGIN} ${cursorY} Td (Sold By:) Tj ET`
  );
  lines.push(
    `BT /F1 9 Tf ${MARGIN} +${-(12)} Td (${escapePdfText(data.seller.name)}) Tj ET`
  );
  for (const ln of wrapText(data.seller.address, 60)) {
    cursorY -= 11;
    lines.push(`BT /F1 8 Tf ${MARGIN} ${cursorY} Td (${escapePdfText(ln)}) Tj ET`);
  }
  lines.push(
    `BT /F1 8 Tf ${MARGIN} ${cursorY - 11} Td (GSTIN: ${escapePdfText(data.seller.gstin)} | ${escapePdfText(data.seller.state)}) Tj ET`
  );

  // Buyer block
  const buyerX = PAGE_WIDTH / 2 + 20;
  lines.push(
    `BT /F2 10 Tf ${buyerX} ${PAGE_HEIGHT - 110} Td (Bill To:) Tj ET`
  );
  lines.push(
    `BT /F1 9 Tf ${buyerX} ${PAGE_HEIGHT - 122} Td (${escapePdfText(data.buyer.name)}) Tj ET`
  );
  let buyerY = PAGE_HEIGHT - 133;
  for (const ln of wrapText(data.buyer.address, 50)) {
    lines.push(`BT /F1 8 Tf ${buyerX} ${buyerY} Td (${escapePdfText(ln)}) Tj ET`);
    buyerY -= 11;
  }
  if (data.buyer.email) {
    lines.push(`BT /F1 8 Tf ${buyerX} ${buyerY} Td (${escapePdfText(data.buyer.email)}) Tj ET`);
    buyerY -= 11;
  }
  if (data.buyer.phone) {
    lines.push(`BT /F1 8 Tf ${buyerX} ${buyerY} Td (${escapePdfText(data.buyer.phone)}) Tj ET`);
    buyerY -= 11;
  }
  lines.push(`BT /F1 8 Tf ${buyerX} ${buyerY} Td (${escapePdfText(data.buyer.state)}) Tj ET`);

  cursorY = Math.min(cursorY - 11, buyerY) - 25;

  // Order & date row
  lines.push(`BT /F1 8 Tf ${MARGIN} ${cursorY} Td (Order ID: ${escapePdfText(data.orderId)}    Date: ${escapePdfText(data.invoiceDate)}    Payment: ${escapePdfText(data.paymentMode)}) Tj ET`);
  cursorY -= 24;

  // Table header
  const colX = [MARGIN, MARGIN + 280, MARGIN + 340, MARGIN + 410, MARGIN + 480];
  drawings.push(`0.92 0.92 0.92 rg`);
  drawings.push(`${MARGIN} ${cursorY - 4} ${PAGE_WIDTH - 2 * MARGIN} 18 re f`);
  drawings.push(`0 0 0 rg`);
  const headers = ["Description", "Qty", "Unit Price", "Amount"];
  headers.forEach((h, i) => {
    const align = i === 0 ? "Tj" : "Tj";
    lines.push(`BT /F2 9 Tf ${colX[i]} ${cursorY} Td (${escapePdfText(h)}) Tj ET`);
  });
  cursorY -= 18;

  // Table rows
  for (const ln of data.lines) {
    const wrapped = wrapText(ln.description, 50);
    lines.push(`BT /F1 8 Tf ${colX[0]} ${cursorY} Td (${escapePdfText(wrapped[0] || "")}) Tj ET`);
    lines.push(`BT /F1 8 Tf ${colX[1]} ${cursorY} Td (${ln.quantity}) Tj ET`);
    lines.push(`BT /F1 8 Tf ${colX[2]} ${cursorY} Td (${escapePdfText(formatINR(ln.unitPrice))}) Tj ET`);
    lines.push(`BT /F1 8 Tf ${colX[3]} ${cursorY} Td (${escapePdfText(formatINR(ln.amount))}) Tj ET`);
    cursorY -= 14;
    for (let i = 1; i < wrapped.length; i++) {
      lines.push(`BT /F1 8 Tf ${colX[0]} ${cursorY} Td (${escapePdfText(wrapped[i])}) Tj ET`);
      cursorY -= 12;
    }
  }

  cursorY -= 8;
  drawings.push(`0.5 0.5 0.5 rg`);
  drawings.push(`${MARGIN} ${cursorY + 4} ${PAGE_WIDTH - 2 * MARGIN} 0.5 re S`);
  drawings.push(`0 0 0 rg`);
  cursorY -= 14;

  // Totals
  const labelX = PAGE_WIDTH - MARGIN - 160;
  const valX = PAGE_WIDTH - MARGIN;
  const drawTotal = (label: string, val: string, bold: boolean) => {
    const font = bold ? "/F2" : "/F1";
    const size = bold ? 10 : 9;
    lines.push(`BT ${font} ${size} Tf ${labelX} ${cursorY} Td (${escapePdfText(label)}) Tj ET`);
    lines.push(`BT ${font} ${size} Tf ${valX - (bold ? 0 : 5)} ${cursorY} Td (${escapePdfText(val)}) Tj ET`);
    cursorY -= bold ? 16 : 13;
  };
  drawTotal("Subtotal", formatINR(data.subtotal), false);
  if (data.cgst > 0) drawTotal(`CGST @ ${(TAX_RATE * 50).toFixed(0)}%`, formatINR(data.cgst), false);
  if (data.sgst > 0) drawTotal(`SGST @ ${(TAX_RATE * 50).toFixed(0)}%`, formatINR(data.sgst), false);
  if (data.igst > 0) drawTotal(`IGST @ ${(TAX_RATE * 100).toFixed(0)}%`, formatINR(data.igst), false);
  drawings.push(`${MARGIN} ${cursorY + 4} ${PAGE_WIDTH - 2 * MARGIN} 0.5 re S`);
  cursorY -= 6;
  drawTotal("Total", formatINR(data.total), true);

  cursorY -= 20;
  if (data.notes) {
    const wrapped = wrapText(data.notes, 90);
    for (const ln of wrapped) {
      lines.push(`BT /F1 8 Tf ${MARGIN} ${cursorY} Td (${escapePdfText(ln)}) Tj ET`);
      cursorY -= 11;
    }
  }

  cursorY = 50;
  lines.push(`BT /F1 7 Tf ${MARGIN} ${cursorY} Td (This is a computer-generated invoice. No signature required.) Tj ET`);
  lines.push(`BT /F1 7 Tf ${MARGIN} ${cursorY - 10} Td (MIIAM Print Services · miiam.app · support@miiam.app) Tj ET`);

  return assemblePdf(lines, drawings);
}

function assemblePdf(textLines: string[], drawings: string[]): Buffer {
  const objects: string[] = [];
  const objectOffsets: number[] = [];

  const contentLines = [...textLines, ...drawings];
  const contentBody = contentLines.join("\n");

  const catalog = "<< /Type /Catalog /Pages 2 0 R >>";
  const pages = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  const page = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;
  const content = `<< /Length ${Buffer.byteLength(contentBody, "latin1")} >>\nstream\n${contentBody}\nendstream`;
  const font1 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const font2 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  objects.push("", catalog, pages, page, content, font1, font2);

  let pdfString = "%PDF-1.4\n";
  for (let i = 1; i < objects.length; i++) {
    objectOffsets[i] = Buffer.byteLength(pdfString, "latin1");
    pdfString += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdfString, "latin1");
  pdfString += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdfString += `${String(objectOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdfString += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdfString, "latin1");
}

export const GST_INVOICE_TAX_RATE = TAX_RATE;
