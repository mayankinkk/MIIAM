import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function activateScheduledOrders() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: scheduledOrders, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "scheduled")
    .lt("scheduled_delivery", now);

  if (fetchError) {
    console.error("[activate-scheduled] Fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!scheduledOrders || scheduledOrders.length === 0) {
    return NextResponse.json({ message: "No scheduled orders to activate", activated: 0 });
  }

  let activatedCount = 0;

  for (const order of scheduledOrders) {
    const scheduledTime = new Date(order.scheduled_delivery).getTime();
    const activateTime = scheduledTime - 60 * 60 * 1000;

    if (activateTime <= Date.now()) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "pending" })
        .eq("id", order.id);

      if (!updateError) {
        activatedCount++;
        console.log(`[activate-scheduled] Activated order ${order.id}`);

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order Being Activated! 🚴",
          body: `Your scheduled order is now visible to riders. They'll pick it up soon!`,
          type: "order_activated",
          order_id: order.id,
        });
      }
    }
  }

  return NextResponse.json({
    message: `Activated ${activatedCount} scheduled orders`,
    activated: activatedCount,
  });
}

export async function POST(request: NextRequest) {
  try {
    return await activateScheduledOrders();
  } catch (error: any) {
    console.error("[activate-scheduled] Error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    return await activateScheduledOrders();
  } catch (error: any) {
    console.error("[activate-scheduled] Error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
