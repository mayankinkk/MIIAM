import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
    }

    const validStatuses = ["accepted", "preparing", "shopping", "picking_up", "on_the_way", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        vendor_id,
        estimated_delivery_time,
        users:user_id(email, full_name),
        vendors:vendor_id(name),
        riders:rider_id(name, phone)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = order.users as { email: string; full_name: string } | null;
    const vendor = order.vendors as { name: string } | null;
    const rider = order.riders as { name: string; phone: string } | null;

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const result = await sendOrderStatusUpdateEmail({
      orderId: order.id,
      customerName: user.full_name || "Customer",
      customerEmail: user.email,
      status,
      vendorName: vendor?.name || "Restaurant",
      estimatedDelivery: order.estimated_delivery_time || undefined,
      riderName: rider?.name || undefined,
      riderPhone: rider?.phone || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order status email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}