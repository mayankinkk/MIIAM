import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateInvoicePdf,
  GST_INVOICE_TAX_RATE,
  type InvoiceData,
  type InvoiceLine,
} from "@/lib/gst-invoice";
import logger from "@/lib/logger";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, total_amount, payment_method, delivery_address, placed_at, user_id, vendor_id, vendors(shop_name, address, gst_number, city, state), profiles(full_name, email, phone)"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("name, quantity, unit_price, price")
      .eq("order_id", id);

    const vendor = order.vendors as {
      shop_name?: string;
      address?: string;
      gst_number?: string | null;
      city?: string | null;
      state?: string | null;
    } | null;
    const profile = order.profiles as {
      full_name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;

    const lines: InvoiceLine[] = (orderItems || []).map((item) => {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unit_price ?? item.price) || 0;
      return {
        description: item.name || "Item",
        quantity: qty,
        unitPrice: unit,
        amount: qty * unit,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
    // Restaurant food is typically 5% GST; keep the lib's 18% only when a GSTIN is present (B2B).
    const hasGstin = !!vendor?.gst_number;
    const rate = hasGstin ? GST_INVOICE_TAX_RATE : 0.05;
    const gst = subtotal * rate;

    const invoiceData: InvoiceData = {
      invoiceNumber: `MIIAM-${order.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: order.placed_at
        ? new Date(order.placed_at).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN"),
      orderId: order.id,
      seller: {
        name: vendor?.shop_name || "MIIAM",
        address: vendor?.address || "MIIAM, Bengaluru, Karnataka",
        gstin: vendor?.gst_number || "UNREGISTERED",
        state: vendor?.state || "Karnataka",
      },
      buyer: {
        name: profile?.full_name || "Customer",
        address: order.delivery_address || "",
        email: profile?.email || "",
        phone: profile?.phone || undefined,
        state: vendor?.state || "Karnataka",
      },
      lines,
      subtotal,
      cgst: gst / 2,
      sgst: gst / 2,
      igst: 0,
      total: subtotal + gst,
      paymentMode: order.payment_method === "cod" ? "Cash on Delivery" : "Online",
      notes: hasGstin
        ? undefined
        : "GST included where applicable. Restaurant services taxed at 5%.",
    };

    const pdf = generateInvoicePdf(invoiceData);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate invoice");
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
