import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, rider_id, reason } = body;
    if (!order_id || !rider_id || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const supabase = await createClient();
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
