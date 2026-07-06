import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("api/promo/validate");

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, vendorIds } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Promo code required" }, { status: 400 });
    }
    if (!subtotal || typeof subtotal !== "number" || subtotal <= 0) {
      return NextResponse.json({ error: "Valid subtotal required" }, { status: 400 });
    }

    const supabase = await createClient();
    const normalizedCode = code.toUpperCase().trim();

    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (promoError) {
      logger.error({ err: promoError }, "Failed to query promo code");
      return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
    }

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Invalid promo code" });
    }

    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, error: "This promo code has expired" });
    }

    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return NextResponse.json({ valid: false, error: "This promo code has reached its usage limit" });
    }

    if (subtotal < promo.min_order_amount) {
      return NextResponse.json({ valid: false, error: `Minimum order ₹${promo.min_order_amount} required` });
    }

    if (promo.vendor_id && vendorIds && Array.isArray(vendorIds)) {
      if (!vendorIds.includes(promo.vendor_id)) {
        return NextResponse.json({ valid: false, error: "This promo code is not applicable to items in your cart" });
      }
    }

    const discountType = promo.discount_type === "percentage" ? "percent" : "flat";
    let discount = promo.discount_value;
    if (discountType === "percent") {
      const raw = subtotal * (promo.discount_value / 100);
      discount = promo.max_discount ? Math.min(raw, promo.max_discount) : raw;
      discount = +discount.toFixed(2);
    }

    return NextResponse.json({
      valid: true,
      code: normalizedCode,
      discount,
      discountType,
      minOrderAmount: promo.min_order_amount,
      vendorId: promo.vendor_id,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Promo validation error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
