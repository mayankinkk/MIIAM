import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkCsrf, getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!await checkIpRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const logger = createRouteLogger("payment/verify");
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

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification parameters" }, { status: 400 });
    }

    // Verify signature
    const crypto = await import("crypto");
    const expectedSignature = crypto.default
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const sigBuf = Buffer.from(expectedSignature, "hex");
    const providedBuf = Buffer.from(razorpay_signature, "hex");
    if (sigBuf.length !== providedBuf.length || !crypto.timingSafeEqual(sigBuf, providedBuf)) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json({ error: `Payment not captured: ${payment.status}` }, { status: 400 });
    }

    // Update order in database if orderId provided
    if (orderId) {
      // Verify the order belongs to the authenticated user
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .maybeSingle();
      if (fetchError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (order.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const supabaseAdmin = createAdminClient();
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "accepted",
        })
        .eq("id", orderId);

      if (updateError) {
        logger.error({ err: updateError }, "Failed to update order payment status");
      }
    }

    return NextResponse.json({
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: Number(payment.amount) / 100,
      method: payment.method,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    logger.error({ err: error }, "Payment verification failed");
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
