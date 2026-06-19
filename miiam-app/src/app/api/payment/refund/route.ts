import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkCsrf, getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const logger = createRouteLogger("payment/refund");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkCsrf(req)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const { orderId, amount, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, payment_method, payment_id, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.payment_id || order.payment_method !== "online") {
      return NextResponse.json({ error: "No online payment found for this order" }, { status: 400 });
    }

    if (order.status === "refunded") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.total_amount * 100);

    const refund = await razorpay.payments.refund(order.payment_id, {
      amount: refundAmount,
      notes: {
        order_id: orderId,
        reason: reason || "Admin initiated refund",
        processed_by: user.id,
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "refunded",
        refund_id: refund.id,
        refund_amount: Number(refund.amount) / 100,
        refund_reason: reason || "Admin initiated refund",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      logger.error({ err: updateError }, "Failed to update order after refund");
    }

    logger.info({ orderId, refundId: refund.id, amount: Number(refund.amount) / 100 }, "Refund processed");

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: Number(refund.amount) / 100,
      status: refund.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Refund processing failed";
    logger.error({ err: error }, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
