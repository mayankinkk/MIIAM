import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";
import {
  FLAT_SERVICE_CHARGE,
  buildScheduledIso,
  normalizePhone,
} from "@/lib/checkout-utils";
import { decrementStock } from "@/lib/stock";
import { SERVICES_VENDOR_ID } from "@/lib/constants";

const logger = createRouteLogger("orders/create");

const UUID = z.string().uuid();

const itemSchema = z.object({
  menu_item_id: UUID,
  name: z.string().min(1).max(300),
  quantity: z.number().int().min(1).max(100),
  unit_price: z.number().min(0).max(1_000_000),
  special_notes: z.string().max(500).optional().nullable(),
});

const groupSchema = z.object({
  vendor_id: UUID,
  items: z.array(itemSchema).min(1).max(100),
});

const createOrderSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  address: z.object({
    flat: z.string().max(200).optional().nullable(),
    street: z.string().min(3).max(500),
    city: z.string().min(1).max(200),
    state: z.string().min(1).max(200),
    postal_code: z.string().min(4).max(12),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
  }),
  paymentMethod: z.string().min(1).max(40),
  subtotal: z.number().min(0).max(10_000_000),
  serviceCharge: z.number().min(0).max(100_000).optional(),
  deliveryFee: z.number().min(0).max(100_000).optional(),
  discount: z.number().min(0).max(10_000_000).optional(),
  tipAmount: z.number().min(0).max(100_000).optional(),
  promoCode: z.string().max(60).optional().nullable(),
  scheduledDate: z.string().max(20).optional().nullable(),
  scheduledTime: z.string().max(60).optional().nullable(),
  specialInstructions: z.string().max(500).optional().nullable(),
  groups: z.array(groupSchema).min(1).max(10),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkIpRateLimit(ip, 15, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || "Invalid order payload", field: first?.path.join(".") },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const phone = normalizePhone(payload.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid phone number", field: "phone" },
      { status: 400 }
    );
  }

  // Signed-in customers keep their user_id; guests get NULL.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    logger.warn({ err }, "Session lookup failed — placing as guest");
  }

  const admin = createAdminClient();

  const scheduledIso = buildScheduledIso(
    payload.scheduledDate || "",
    payload.scheduledTime || ""
  );

  const subtotal = payload.subtotal;
  const serviceCharge = payload.serviceCharge ?? FLAT_SERVICE_CHARGE;
  const deliveryFee = payload.deliveryFee ?? 0;
  const discount = payload.discount ?? 0;
  const tipAmount = payload.tipAmount ?? 0;

  const finalAddress = [
    payload.address.flat,
    payload.address.street,
    payload.address.city,
    payload.address.state,
    payload.address.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const placedAt = new Date().toISOString();
  const createdOrderIds: string[] = [];
  const stockWarnings: string[] = [];

  try {
    for (const group of payload.groups) {
      const vendorTotal = group.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      const share = subtotal > 0 ? vendorTotal / subtotal : 0;

      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          user_id: userId,
          vendor_id: group.vendor_id,
          status: scheduledIso ? "scheduled" : "pending",
          total_amount: +(vendorTotal + serviceCharge * share).toFixed(2),
          delivery_fee: +(deliveryFee * share).toFixed(2),
          discount_amount: +(discount * share).toFixed(2),
          tip_amount: +(tipAmount * share).toFixed(2),
          payment_method: payload.paymentMethod,
          delivery_address: finalAddress,
          delivery_lat: payload.address.lat ?? null,
          delivery_lng: payload.address.lng ?? null,
          scheduled_delivery: scheduledIso,
          special_instructions: payload.specialInstructions || null,
          customer_phone: phone,
          placed_at: placedAt,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        throw orderError ?? new Error("Order insert failed");
      }

      createdOrderIds.push(order.id);

      const { error: itemsError } = await admin.from("order_items").insert(
        group.items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          price: +(item.unit_price * item.quantity).toFixed(2),
          special_notes: item.special_notes || null,
        }))
      );

      if (itemsError) {
        await admin.from("orders").delete().eq("id", order.id);
        createdOrderIds.pop();
        throw itemsError;
      }

      if (!payload.scheduledDate) {
        const stockItems = group.items
          .filter((i) => group.vendor_id !== SERVICES_VENDOR_ID)
          .map((i) => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            name: i.name,
            vendor_id: group.vendor_id,
          }));
        if (stockItems.length > 0) {
          const stockResult = await decrementStock(stockItems, order.id, admin);
          if (!stockResult.success && stockResult.error) {
            // Non-fatal, matching the previous client-side behaviour.
            logger.warn({ orderId: order.id, err: stockResult.error }, "Stock decrement failed");
            stockWarnings.push(stockResult.error);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      orderIds: createdOrderIds,
      firstOrderId: createdOrderIds[0],
      stockWarnings,
    });
  } catch (error: unknown) {
    // Best-effort rollback of any rows already written in this request.
    if (createdOrderIds.length > 0) {
      await admin.from("orders").delete().in("id", createdOrderIds);
    }

    const err = error as { code?: string; message?: string };
    logger.error({ err: error }, "Order creation failed");

    if (err?.code === "23502") {
      return NextResponse.json(
        {
          error:
            "Guest orders are not enabled yet — run supabase/migrations/20260929_guest_orders.sql in the Supabase SQL editor.",
          code: "GUEST_ORDERS_DISABLED",
        },
        { status: 500 }
      );
    }
    if (err?.code === "23503" || err?.message?.includes("violates foreign key")) {
      return NextResponse.json(
        { error: "Some items are no longer available. Please refresh and try again." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not place your order. Please try again." },
      { status: 500 }
    );
  }
}
