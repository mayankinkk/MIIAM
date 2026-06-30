import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("emails/order-confirmation");

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        user_id,
        vendor_id,
        delivery_address,
        total_amount,
        delivery_fee,
        discount_amount,
        users:user_id(email, full_name),
        vendors:vendor_id(shop_name)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const usersData = order.users;
    const user = Array.isArray(usersData)
      ? usersData[0]
      : (usersData as { email: string; full_name: string } | null);

    const vendorsData = order.vendors;
    const vendor = Array.isArray(vendorsData)
      ? vendorsData[0]
      : (vendorsData as { shop_name: string } | null);

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("name, quantity, price")
      .eq("order_id", orderId);

    const result = await sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: user.full_name || "Customer",
      customerEmail: user.email,
      vendorName: vendor?.shop_name || "Restaurant",
      items: items?.map((i) => ({
        name: i.name || "Item",
        quantity: i.quantity,
        price: i.price,
      })) || [],
      subtotal: (order.total_amount || 0) - (order.delivery_fee || 0) + (order.discount_amount || 0),
      deliveryFee: order.delivery_fee || 0,
      total: order.total_amount || 0,
      deliveryAddress: order.delivery_address || "",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Order confirmation email error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}