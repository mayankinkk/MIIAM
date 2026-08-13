import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import logger from "@/lib/logger";

export async function GET(request: Request) {
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
    const url = new URL(request.url);
    const dateFilter = url.searchParams.get("dateFilter") || "all";

    let query = admin
      .from("orders")
      .select("*, vendor:vendors(id, name, shop_name), items:order_items(*, menu_item:menu_items(name))")
      .order("placed_at", { ascending: false });

    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte("placed_at", today.toISOString());
    } else if (dateFilter === "week") {
      const week = new Date();
      week.setDate(week.getDate() - 7);
      query = query.gte("placed_at", week.toISOString());
    } else if (dateFilter === "month") {
      const month = new Date();
      month.setDate(month.getDate() - 30);
      query = query.gte("placed_at", month.toISOString());
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      logger.error({ err: ordersError }, "Failed to fetch food orders");
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [], vendors: [] });
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

    const enriched = orders.map((o: Record<string, unknown>) => ({
      ...o,
      customer_profile: o.user_id ? profileMap[o.user_id as string] || null : null,
      customer_address: o.delivery_address_id ? addressMap[o.delivery_address_id as string] || null : null,
    }));

    const { data: vendorsData } = await admin.from("vendors").select("id, shop_name");

    return NextResponse.json({
      orders: enriched,
      vendors: vendorsData || [],
    });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Food orders API error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Unauthorized" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") return { error: "Forbidden" as const };
  return { admin: createAdminClient() };
}

export async function PATCH(request: Request) {
  try {
    const auth = await verifyAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });

    const body = await request.json();
    const { orderId, status } = body as { orderId?: string; status?: string };
    if (!orderId || !status) return NextResponse.json({ error: "orderId and status required" }, { status: 400 });

    const { error } = await auth.admin.from("orders").update({ status }).eq("id", orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Food orders PATCH error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin();
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });

    const body = await request.json();
    const { orderIds, status } = body as { orderIds?: string[]; status?: string };
    if (!orderIds?.length || !status) return NextResponse.json({ error: "orderIds and status required" }, { status: 400 });

    const { error } = await auth.admin.from("orders").update({ status }).in("id", orderIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: orderIds.length });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Food orders POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
