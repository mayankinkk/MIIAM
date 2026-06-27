import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIpRateLimit, getClientIp } from "@/lib/security";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!await checkIpRateLimit(ip, 5, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: bookings } = await supabase
      .from("service_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id);

    const { data: addresses } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id);

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      profile,
      orders,
      bookings,
      reviews,
      addresses,
      notifications,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="miiam-data-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (e) {
    console.error("[DataExport] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
