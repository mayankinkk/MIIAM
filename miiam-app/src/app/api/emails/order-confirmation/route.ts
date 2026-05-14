import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        vendor_id,
        delivery_address,
        subtotal,
        delivery_fee,
        tip,
        total,
        estimated_delivery_time,
        users:user_id(email, full_name),
        vendors:vendor_id(name)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = order.users as { email: string; full_name: string } | null;
    const vendor = order.vendors as { name: string } | null;

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("name, quantity, price")
      .eq("order_id", orderId);

    const result = await sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: user.full_name || "Customer",
      customerEmail: user.email,
      vendorName: vendor?.name || "Restaurant",
      items: items?.map((i) => ({
        name: i.name || "Item",
        quantity: i.quantity,
        price: i.price,
      })) || [],
      subtotal: order.subtotal || 0,
      deliveryFee: order.delivery_fee || 0,
      tip: order.tip || undefined,
      total: order.total || 0,
      deliveryAddress: order.delivery_address || "",
      estimatedDelivery: order.estimated_delivery_time || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order confirmation email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}