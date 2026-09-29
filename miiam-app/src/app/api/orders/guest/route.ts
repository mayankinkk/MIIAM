import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";
import { normalizePhone } from "@/lib/checkout-utils";

const logger = createRouteLogger("orders/guest");

const refSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().min(1),
});

const listSchema = z.object({
  refs: z.array(refSchema).min(1).max(50),
});

/**
 * Read-only view of orders this device placed without an account.
 * Auth = the order id (unguessable UUID) + the phone number captured at
 * checkout; the service role is used so anon visitors can read their own rows
 * without weakening RLS for everyone else.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkIpRateLimit(ip, 60, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawRefs = request.nextUrl.searchParams.get("refs");
  if (!rawRefs) {
    return NextResponse.json({ error: "refs required" }, { status: 400 });
  }

  let refsJson: unknown;
  try {
    refsJson = JSON.parse(rawRefs);
  } catch {
    return NextResponse.json({ error: "refs must be JSON" }, { status: 400 });
  }

  const parsed = listSchema.safeParse(refsJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid refs" }, { status: 400 });
  }

  const refs = parsed.data.refs.map((r) => ({ id: r.id, phone: normalizePhone(r.phone) }));
  if (refs.some((r) => !r.phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const ids = refs.map((r) => r.id);
  const admin = createAdminClient();

  try {
    const { data: orders, error } = await admin
      .from("orders")
      .select(
        "id, user_id, vendor_id, rider_id, status, total_amount, delivery_fee, discount_amount, payment_method, delivery_address, special_instructions, placed_at, delivered_at, scheduled_delivery, customer_phone"
      )
      .in("id", ids);

    if (error) {
      logger.error({ err: error }, "Failed to load guest orders");
      return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
    }

    const phoneById = new Map(refs.map((r) => [r.id, r.phone]));
    const visible = (orders || []).filter((o) => phoneById.get(o.id) === o.customer_phone);
    if (visible.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const visibleIds = visible.map((o) => o.id);
    const vendorIds = [...new Set(visible.map((o) => o.vendor_id).filter(Boolean))] as string[];
    const riderIds = [...new Set(visible.map((o) => o.rider_id).filter(Boolean))] as string[];

    const itemsRes = await admin
      .from("order_items")
      .select(
        "id, order_id, menu_item_id, name, quantity, price, unit_price, special_notes, status, actual_price, picked"
      )
      .in("order_id", visibleIds);

    const { data: vendors } =
      vendorIds.length > 0
        ? await admin.from("vendors").select("id, shop_name, address, phone, cover_image_url, latitude, longitude").in("id", vendorIds)
        : { data: [] as { id: string }[] };

    const { data: riders } =
      riderIds.length > 0
        ? await admin.from("riders").select("id, name, phone").in("id", riderIds)
        : { data: [] as { id: string }[] };

    const { data: locations } = await admin
      .from("rider_locations")
      .select("order_id, lat, lng")
      .in("order_id", visibleIds)
      .order("created_at", { ascending: false })
      .limit(visibleIds.length);

    const itemsByOrder = new Map<string, unknown[]>();
    for (const item of itemsRes.data || []) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }

    const vendorById = new Map((vendors || []).map((v) => [v.id, v]));
    const riderById = new Map((riders || []).map((r) => [r.id, r]));
    const locationByOrder = new Map((locations || []).map((l) => [l.order_id, l]));

    const enriched = visible
      .map((order) => ({
        ...order,
        vendor: vendorById.get(order.vendor_id) || null,
        rider: order.rider_id ? riderById.get(order.rider_id) || null : null,
        items: itemsByOrder.get(order.id) || [],
        _location: locationByOrder.get(order.id)
          ? {
              lat: (locationByOrder.get(order.id) as { lat: number }).lat,
              lng: (locationByOrder.get(order.id) as { lng: number }).lng,
            }
          : null,
      }))
      .sort((a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime());

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    logger.error({ err: error }, "Guest order lookup failed");
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
}
