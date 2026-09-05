import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("*, vendor:vendors(name, shop_name), rider:riders(name, phone)")
      .order("placed_at", { ascending: false });

    if (ordersError) {
      logger.error({ err: ordersError }, "Failed to fetch admin orders");
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [], orderItems: {} });
    }

    const userIds = [...new Set(orders.map((o: Record<string, unknown>) => o.user_id).filter(Boolean))] as string[];
    const profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);
      if (profiles) {
        profiles.forEach((p: { id: string; full_name: string | null; phone: string | null }) => {
          profileMap[p.id] = { full_name: p.full_name, phone: p.phone };
        });
      }
    }

    const addressIds = orders
      .map((o: Record<string, unknown>) => o.delivery_address_id)
      .filter(Boolean) as string[];
    const addressMap: Record<string, { street: string; city: string; state: string; postal_code: string; label?: string }> = {};

    if (addressIds.length > 0) {
      const { data: addresses } = await admin
        .from("addresses")
        .select("id, street, city, state, postal_code, label")
        .in("id", addressIds);
      if (addresses) {
        addresses.forEach((a: { id: string; street: string; city: string; state: string; postal_code: string; label?: string }) => {
          addressMap[a.id] = a;
        });
      }
    }

    const orderIds = orders.map((o: Record<string, unknown>) => o.id as string);
    const itemsMap: Record<string, { name: string; quantity: number; unit_price: number }[]> = {};

    if (orderIds.length > 0) {
      const { data: allItems } = await admin
        .from("order_items")
        .select("order_id, quantity, unit_price, menu_item:menu_items(name)")
        .in("order_id", orderIds);
      if (allItems) {
        allItems.forEach((i: { order_id: string; quantity: number; unit_price: number; menu_item?: { name: string }[] | { name: string } | null }) => {
          if (!itemsMap[i.order_id]) itemsMap[i.order_id] = [];
          const menuName = Array.isArray(i.menu_item) ? i.menu_item[0]?.name : i.menu_item?.name;
          itemsMap[i.order_id].push({ name: menuName || "Item", quantity: i.quantity, unit_price: i.unit_price });
        });
      }
    }

    const enriched = orders.map((o: Record<string, unknown>) => {
      const profile = o.user_id ? profileMap[o.user_id as string] || null : null;
      return {
        ...o,
        customer_profile: profile ? {
          full_name: profile.full_name,
          phone: profile.phone || (o.customer_phone as string) || null,
        } : (o.customer_phone ? { full_name: null, phone: o.customer_phone as string } : null),
        customer_address: o.delivery_address_id ? addressMap[o.delivery_address_id as string] || null : null,
      };
    });

    return NextResponse.json({
      orders: enriched,
      orderItems: itemsMap,
    });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Admin orders API error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
