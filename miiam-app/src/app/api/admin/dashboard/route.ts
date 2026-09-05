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

    const [ordersRes, vendorsRes, ridersRes, usersRes] = await Promise.all([
      admin.from("orders").select("id, total_amount, status, placed_at, vendor_id").order("placed_at", { ascending: false }).limit(500),
      admin.from("vendors").select("id, shop_name, owner_name, type, status, created_at").order("created_at", { ascending: false }).limit(8),
      admin.from("riders").select("id, status").limit(200),
      admin.from("profiles").select("id, created_at").limit(1000),
    ]);

    return NextResponse.json({
      orders: ordersRes.data || [],
      vendors: vendorsRes.data || [],
      riders: ridersRes.data || [],
      users: usersRes.data || [],
      errors: {
        orders: ordersRes.error?.message || null,
        vendors: vendorsRes.error?.message || null,
        riders: ridersRes.error?.message || null,
        users: usersRes.error?.message || null,
      },
    });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Admin dashboard API error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
