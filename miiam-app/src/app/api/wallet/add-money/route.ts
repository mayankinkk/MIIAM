import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";
import { checkCsrf } from "@/lib/security";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkCsrf(req)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify Razorpay signature
    const crypto = await import("crypto");
    const expectedSignature = crypto.default
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Verify payment status with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json({ error: `Payment not captured: ${payment.status}` }, { status: 400 });
    }

    // Verify amount matches
    const paidAmount = Number(payment.amount) / 100;
    if (paidAmount !== amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Increment wallet balance
    const supabaseAdmin = createAdminClient();
    const { error: rpcError } = await supabaseAdmin.rpc("increment_wallet_balance", {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (rpcError) {
      console.error("[wallet] RPC error:", rpcError);
      return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
    }

    // Record the transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: user.id,
      amount,
      type: "deposit",
      status: "completed",
    });

    return NextResponse.json({ success: true, amount });
  } catch (error: any) {
    console.error("[wallet] Error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
