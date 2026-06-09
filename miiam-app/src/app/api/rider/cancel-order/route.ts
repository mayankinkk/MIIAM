import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, rider_id, reason } = body;
    if (!order_id || !rider_id || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify the rider belongs to the authenticated user
    const { data: rider, error: riderError } = await supabase
      .from("riders")
      .select("id")
      .eq("id", rider_id)
      .eq("user_id", user.id)
      .single();
    if (riderError || !rider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("orders").update({ status: "cancelled", rider_id: null }).eq("id", order_id).eq("rider_id", rider_id);
    if (error) throw error;
    await supabase.from("rider_incidents").insert({
      rider_id,
      order_id,
      type: "cancellation",
      description: reason,
      status: "logged",
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
