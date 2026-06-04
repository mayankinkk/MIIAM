import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf, GST_INVOICE_TAX_RATE, type InvoiceData, type InvoiceLine } from "@/lib/gst-invoice";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const SELLER = {
  name: "MIIAM Print Services",
  address: "Plot 14, Sector 18, MG Road, Bengaluru, Karnataka 560001",
  gstin: "29ABCDE1234F1Z5",
  state: "Karnataka (29)",
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.vendor_id !== PRINTING_VENDOR_ID) {
      return NextResponse.json({ error: "Invoices are only available for print orders" }, { status: 400 });
    }

    const lines: InvoiceLine[] = (order.order_items || []).map((it: any) => {
      const qty = it.quantity || 1;
      const unit = (it.price || 0) / qty;
      let desc = it.name || "Print job";
      let settings: Record<string, any> = {};
      try { if (it.special_notes) settings = JSON.parse(it.special_notes); } catch {}
      const meta: string[] = [];
      if (settings.colorMode) meta.push(settings.colorMode === "bw" ? "B&W" : "Color");
      if (settings.paperSize) meta.push(String(settings.paperSize).toUpperCase());
      if (settings.sides) meta.push(settings.sides === "double" ? "2-sided" : "1-sided");
      if (settings.pages) meta.push(`${settings.pages} pages`);
      if (meta.length) desc += ` (${meta.join(", ")})`;
      return {
        description: desc,
        quantity: qty,
        unitPrice: unit,
        amount: it.price || 0,
      };
    });

    const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
    const tax = subtotal * GST_INVOICE_TAX_RATE;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, state")
      .eq("id", user.id)
      .maybeSingle();

    const invoiceNumber = `MIIAM-PRI-${orderId.slice(0, 8).toUpperCase()}`;
    const data: InvoiceData = {
      invoiceNumber,
      invoiceDate: new Date(order.created_at || Date.now()).toISOString().slice(0, 10),
      orderId,
      seller: SELLER,
      buyer: {
        name: profile?.full_name || user.email?.split("@")[0] || "Customer",
        address: "—",
        email: user.email || "",
        phone: profile?.phone || undefined,
        state: profile?.state || "—",
      },
      lines,
      subtotal,
      cgst: tax / 2,
      sgst: tax / 2,
      igst: 0,
      total: subtotal + tax,
      paymentMode: (order as any).payment_method || "Online",
      notes: "Files auto-deleted after delivery for privacy. No refunds on completed print jobs.",
    };

    const pdfBuffer = generateInvoicePdf(data);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoiceNumber}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[invoice] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
